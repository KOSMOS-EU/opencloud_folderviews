#!/usr/bin/env python3
"""
import_tree.py — Importiert eine YAML-Tree-Datei in einen OpenCloud Space
mit _type_* Markern und oy.fileReference Aktenzeichen.

Usage:
  python3 import_tree.py <yaml-file> <space-root-path> [--owner USER:GROUP] [--dry-run]

Tiefe-zu-Typ Mapping:
  0 = Space-Root (aktenplan)
  1..n-1 = Sachgruppen (aktenplan, protected)
  n (Blatt ohne Unter-Ordner) = Aktenschrank (aktenplan, shielded durch Parent)
  Ordner mit docs aber ohne folders = Akte

Aktenzeichen-Generierung:
  Sachgruppen: parentRef.{seq:2}  (11, 11.01, 11.01.01)
  Blatt→Akte:  parentRef-{seq:2}  (11.01.01-01)
"""

import yaml
import os
import sys
import subprocess

def setxattr(path, key, value):
    subprocess.run(['setfattr', '-n', f'user.oc.md.{key}', '-v', value, path], check=True)

def set_immutable(path):
    subprocess.run(['setfattr', '-n', 'user.oc.immutable', '-v', '1', path], check=True)

def chown(path, owner):
    subprocess.run(['chown', '-R', owner, path], check=True)

def has_subfolders(node):
    return bool(node.get('folders'))

def sanitize_name(name):
    """Clean up folder names from YAML (remove newlines etc.)"""
    return name.replace('\n', ' ').replace('\r', '').strip()

def process_node(node, parent_path, parent_ref, depth, seq, owner, dry_run, is_leaf_parent):
    """
    Process a tree node recursively.

    Args:
        node: YAML node dict with 'name', optional 'folders', 'docs'
        parent_path: filesystem path of parent
        parent_ref: parent's fileReference (e.g. "11.12")
        depth: current depth (0=root)
        seq: sequence number among siblings (1-based)
        owner: chown target
        dry_run: if True, only print
        is_leaf_parent: True if parent has no further folder-children beyond this level
    """
    name = sanitize_name(node['name'])
    path = os.path.join(parent_path, name)
    folders = node.get('folders', [])
    has_children = bool(folders)

    # Determine type and fileReference
    if depth == 0:
        # Space root — already exists, just set type
        folder_type = 'aktenplan'
        file_ref = ''
        protect = False
    elif has_children:
        # Has sub-folders → Sachgruppe (aktenplan)
        folder_type = 'aktenplan'
        file_ref = f"{parent_ref}.{seq:02d}" if parent_ref else f"{seq:02d}"
        # Protected if any child also has sub-folders (not leaf level)
        any_child_has_folders = any(has_subfolders(f) for f in folders)
        protect = any_child_has_folders
    else:
        # No sub-folders → could be Akte or bare Aktenschrank leaf
        # If parent was aktenplan type and this is a leaf → Aktenschrank (aktenplan, shielded)
        # But we can't distinguish perfectly, so: leaf folders without children = akte
        folder_type = 'akte'
        file_ref = f"{parent_ref}-{seq:02d}" if parent_ref else f"{seq:02d}"
        protect = False

    # Print
    status = "protected" if protect else ("shielded" if not protect and folder_type == 'aktenplan' and depth > 0 and not has_children else "")
    prefix = "  " * depth
    print(f"{prefix}{folder_type:12s} {file_ref:20s} {status:10s} {name}")

    if not dry_run:
        if depth > 0:
            os.makedirs(path, exist_ok=True)

        # _type_ marker
        type_marker = os.path.join(path, f'_type_{folder_type}')
        open(type_marker, 'w').close()

        # fileReference
        if file_ref:
            setxattr(path, 'oy.fileReference', file_ref)

        # Protection
        if protect:
            set_immutable(path)

        # Ownership
        if owner:
            chown(path, owner)

    # Recurse into children
    for i, child in enumerate(folders, start=1):
        process_node(child, path, file_ref, depth + 1, i, owner, dry_run, not has_children)


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Import YAML tree into OpenCloud space')
    parser.add_argument('yaml_file', help='YAML tree file')
    parser.add_argument('space_root', help='Space root path')
    parser.add_argument('--owner', default='adminuser:adminuser', help='chown target (default: adminuser:adminuser)')
    parser.add_argument('--dry-run', action='store_true', help='Only print, do not create')
    args = parser.parse_args()

    with open(args.yaml_file) as f:
        data = yaml.safe_load(f)

    space = args.space_root.rstrip('/')
    if not os.path.isdir(os.path.join(space, '.space')):
        print(f"ERROR: {space} is not a valid space root (.views/ missing)")
        sys.exit(1)

    tree = data['tree']
    volume = data.get('volume', tree['name'])
    total = data.get('total_folders', '?')

    print(f"=== Importing '{volume}' ({total} folders) into {space} ===")
    print()

    # Ensure schemas exist
    views_dir = os.path.join(space, '.space', 'views')
    if not os.path.isdir(views_dir):
        print(f"WARNING: {views_dir} does not exist — run skeleton_sample.sh first for schemas")

    # Process root (depth=0, the root itself already exists)
    process_node(tree, space, '', 0, 0, args.owner, args.dry_run, False)

    print()
    print("=== Import complete ===")


if __name__ == '__main__':
    main()
