#!/usr/bin/env python3
"""
import_tree_webdav.py — Importiert eine YAML-Tree-Datei in einen OpenCloud Space
über WebDAV (MKCOL, PUT) und die Metadata API.

Usage:
  python3 import_tree_webdav.py <yaml-file> <space-webdav-url> [--user admin:admin] [--dry-run]

Example:
  python3 import_tree_webdav.py trees/Innere_Verwaltung.yaml \
    https://cloud.brandis.eu/dav/spaces/f7e671d7-36e5-493f-b0c7-ffe5ee4319a5\$f9f939a9-5910-46b8-9abb-eb54e6628b2a \
    --user admin:admin

  The space WebDAV URL can be found in the browser URL or via:
    GET /graph/v1.0/drives → drive.root.webDavUrl
"""

import yaml
import sys
import argparse
import requests
from urllib.parse import quote

requests.packages.urllib3.disable_warnings()


def webdav_mkcol(session, base_url, path):
    """Create a folder via WebDAV MKCOL."""
    url = f"{base_url}/{quote(path, safe='/')}"
    r = session.request('MKCOL', url, verify=False)
    if r.status_code in (201, 405):  # 201=created, 405=already exists
        return True
    print(f"  WARN: MKCOL {path} → {r.status_code}")
    return False


def webdav_put(session, base_url, path, content=''):
    """Create a file via WebDAV PUT."""
    url = f"{base_url}/{quote(path, safe='/')}"
    r = session.put(url, data=content.encode('utf-8'), verify=False)
    if r.status_code in (201, 204):
        return True
    print(f"  WARN: PUT {path} → {r.status_code}")
    return False


def metadata_put(session, graph_url, space_id, item_path, metadata):
    """Set metadata via Graph API. Needs the item ID, so we PROPFIND first."""
    # Get item ID via PROPFIND
    propfind_body = '<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:prop><oc:fileid/></d:prop></d:propfind>'
    dav_url = f"{graph_url.rsplit('/graph', 1)[0]}/dav/spaces/{quote(space_id, safe='$!')}/{quote(item_path, safe='/')}"
    r = session.request('PROPFIND', dav_url, data=propfind_body,
                        headers={'Depth': '0', 'Content-Type': 'application/xml'},
                        verify=False)
    if r.status_code != 207:
        print(f"  WARN: PROPFIND {item_path} → {r.status_code}")
        return False

    # Extract fileid from response
    import re
    match = re.search(r'<oc:fileid>([^<]+)</oc:fileid>', r.text)
    if not match:
        print(f"  WARN: no fileid found for {item_path}")
        return False
    file_id = match.group(1)

    # PUT metadata — keep $ and ! in IDs unencoded
    url = f"{graph_url}/v1beta1/drives/{quote(space_id, safe='$!')}/items/{quote(file_id, safe='$!')}/metadata"
    r = session.put(url, json=metadata, verify=False)
    if r.status_code in (200, 204):
        return True
    print(f"  WARN: metadata PUT {item_path} → {r.status_code} {r.text[:100]}")
    return False


def set_immutable(session, graph_url, space_id, item_path):
    """Protect a folder via Graph API."""
    import re
    propfind_body = '<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:prop><oc:fileid/></d:prop></d:propfind>'
    dav_url = f"{graph_url.rsplit('/graph', 1)[0]}/dav/spaces/{quote(space_id, safe='$!')}/{quote(item_path, safe='/')}"
    r = session.request('PROPFIND', dav_url, data=propfind_body,
                        headers={'Depth': '0', 'Content-Type': 'application/xml'},
                        verify=False)
    if r.status_code != 207:
        return False
    match = re.search(r'<oc:fileid>([^<]+)</oc:fileid>', r.text)
    if not match:
        return False
    file_id = match.group(1)

    url = f"{graph_url}/v1beta1/drives/{quote(space_id, safe='$!')}/items/{quote(file_id, safe='')}/protect"
    r = session.post(url, verify=False)
    return r.status_code == 204


def sanitize_name(name):
    return name.replace('\n', ' ').replace('\r', '').strip()


def has_subfolders(node):
    return bool(node.get('folders'))


def process_node(session, base_url, graph_url, space_id, node, parent_path, parent_ref, depth, seq, dry_run, protect_queue):
    name = sanitize_name(node['name'])
    path = f"{parent_path}/{name}" if parent_path else name
    folders = node.get('folders', [])
    has_children = bool(folders)

    # Determine type and fileReference
    if depth == 0:
        folder_type = 'aktenplan'
        file_ref = ''
        protect = False
    elif has_children:
        folder_type = 'aktenplan'
        file_ref = f"{parent_ref}.{seq:02d}" if parent_ref else f"{seq:02d}"
        any_child_has_folders = any(has_subfolders(f) for f in folders)
        protect = any_child_has_folders
    else:
        folder_type = 'akte'
        file_ref = f"{parent_ref}-{seq:02d}" if parent_ref else f"{seq:02d}"
        protect = False

    status = "protected" if protect else ""
    prefix = "  " * depth
    print(f"{prefix}{folder_type:12s} {file_ref:20s} {status:10s} {name}")

    if not dry_run:
        if depth > 0:
            webdav_mkcol(session, base_url, path)
        elif depth == 0 and parent_path == '':
            # depth=0 is the tree root — create it as a folder in the space
            webdav_mkcol(session, base_url, name)

        # _type_ marker file
        webdav_put(session, base_url, f"{path}/_type_{folder_type}")

        # fileReference metadata
        if file_ref:
            metadata_put(session, graph_url, space_id, path, {'oy.fileReference': file_ref})

        # Queue protection for later (after all children are created)
        if protect:
            protect_queue.append(path)

    for i, child in enumerate(folders, start=1):
        process_node(session, base_url, graph_url, space_id, child, path, file_ref, depth + 1, i, dry_run, protect_queue)


def main():
    parser = argparse.ArgumentParser(description='Import YAML tree via WebDAV')
    parser.add_argument('yaml_file', help='YAML tree file')
    parser.add_argument('space_webdav_url', help='Space WebDAV URL (https://host/dav/spaces/SPACEID)')
    parser.add_argument('--user', default='admin:admin', help='user:password (default: admin:admin)')
    parser.add_argument('--dry-run', action='store_true', help='Only print, do not create')
    args = parser.parse_args()

    with open(args.yaml_file) as f:
        data = yaml.safe_load(f)

    base_url = args.space_webdav_url.rstrip('/')
    user, password = args.user.split(':', 1)

    # Derive graph URL and space ID from WebDAV URL
    # URL format: https://host/dav/spaces/STORAGEID$SPACEID
    host_part = base_url.rsplit('/dav/spaces/', 1)[0]
    space_id = base_url.rsplit('/dav/spaces/', 1)[1]
    graph_url = f"{host_part}/graph"

    session = requests.Session()
    session.auth = (user, password)

    tree = data['tree']
    volume = data.get('volume', tree['name'])
    total = data.get('total_folders', '?')

    print(f"=== Importing '{volume}' ({total} folders) via WebDAV ===")
    print(f"    Space: {space_id}")
    print(f"    Host:  {host_part}")
    print()

    # Create .space/views/ schemas first
    if not args.dry_run:
        schemas = {
            'aktenplan': '{"label":"Aktenplan","icon":"archive","children":{"protected":["aktenplan"],"shielded":["akte"],"default":["aktenplan","akte"]},"columns":["name","oy.fileReference","typ","anzahl"],"fileReferencePattern":"{parentRef}.{seq:02}","metadata":{"oy.fileReference":{"label":"Aktenzeichen","type":"string","auto":true}}}',
            'akte': '{"label":"Akte","icon":"folder-open","children":["vorgang"],"columns":["name","oy.fileReference","oy.status","abgelegt-von","abgelegt-am"],"fileReferencePattern":"{parentRef}-{seq:02}","metadata":{"oy.fileReference":{"label":"Aktenzeichen","type":"string","auto":true},"oy.status":{"label":"Status","type":"enum","values":["offen","gespeichert","geschlossen"],"default":"offen"}}}',
            'vorgang': '{"label":"Vorgang","icon":"file-list","children":["register"],"columns":["name","oy.fileReference","oy.version","abgelegt-von","abgelegt-am"],"fileReferencePattern":"{parentRef}/{seq}","metadata":{"oy.fileReference":{"label":"Aktenzeichen","type":"string","auto":true},"oy.version":{"label":"Version","type":"string"}}}',
            'register': '{"label":"Register","icon":"bookmark","children":[],"columns":["name","oy.fileReference","abgelegt-von","abgelegt-am"],"fileReferencePattern":"{parentRef}#{seq}","metadata":{"oy.fileReference":{"label":"Aktenzeichen","type":"string","auto":true}}}'
        }
        webdav_mkcol(session, base_url, '.space/views')
        for name, content in schemas.items():
            webdav_put(session, base_url, f'.space/views/{name}.json', content)
        print("[ok] Schema files created")

        # Space root type marker
        webdav_put(session, base_url, '_type_aktenplan')
        print("[ok] Space root _type_aktenplan created")
        print()

    protect_queue = []
    process_node(session, base_url, graph_url, space_id, tree, '', '', 0, 0, args.dry_run, protect_queue)

    # Phase 2: Set protection after all folders are created
    if protect_queue and not args.dry_run:
        print()
        print(f"[protect] Setting protection on {len(protect_queue)} folders...")
        for path in protect_queue:
            ok = set_immutable(session, graph_url, space_id, path)
            print(f"  {'OK' if ok else 'WARN'}: {path}")

    print()
    print("=== Import complete ===")


if __name__ == '__main__':
    main()
