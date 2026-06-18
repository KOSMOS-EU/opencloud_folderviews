# opencloud_folderviews

Typed folder views and custom list views for OpenCloud Web.

## Features

### Typed Folder Views (Aktenplan)
Folder views that activate based on `_type_<typename>` marker files in the directory.
Schema definitions in `.views/<type>.json` control columns, actions, and child types.

- **AktenplanView** — Sachgruppen hierarchy with protection states
- **AkteView** — Leitzordner with status tracking
- **VorgangView** — Thematic grouping with versions
- **RegisterView** — Fine-grained document organization

### List Views
Two additional folder view modes available in the view mode switcher:

- **Tree View** — Expandable tree with lazy-loaded children, based on ResourceTable (condensed mode) with all columns, quick actions, and context menu
- **Metro View** — Colored tile grid based on ResourceTiles with centered bold names, hidden thumbnails, and full context menu support

## Build

```bash
pnpm install
npx vite build --mode opencloud
```

## Deploy

```bash
./publish_app.sh
```

Or manually:
```bash
rsync -avz --delete deploy/folderviews/ root@<host>:/data/opencloud_podman/views/folderviews/
```

Mount in `extensions.yml`:
```yaml
- ./views/folderviews:/var/lib/opencloud/web/assets/apps/folderviews:ro
```

## Tools

- `import_tree_webdav.py` — Import YAML tree structures via WebDAV
- `skeleton_sample.sh` — Create Aktenplan test skeleton on disk
- `tree_view.py` — Display tree structures from YAML

## Documentation

- [FOLDERVIEWPLUS.md](FOLDERVIEWPLUS.md) — Architecture overview
- [AKTENPLAN.md](AKTENPLAN.md) — Aktenplan type hierarchy and schema definitions
- [TASK_typed_folderviews.md](TASK_typed_folderviews.md) — Implementation task tracker
