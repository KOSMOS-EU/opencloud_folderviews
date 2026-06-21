#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/DIST"

REMOTE_BASE="${DATAPATH:?Set DATAPATH in DIST}"

echo "=== Publish: $APP ==="

# Build
echo "[build] $BUILD_CMD"
(cd "$SCRIPT_DIR" && eval "$BUILD_CMD")

# Verify
if [ ! -f "$SCRIPT_DIR/$DEPLOY_DIR/remoteEntry.mjs" ]; then
    echo "ERROR: $DEPLOY_DIR/remoteEntry.mjs not found"
    exit 1
fi

# Hash the entrypoint for cache-busting
HASH=$(md5sum "$SCRIPT_DIR/$DEPLOY_DIR/remoteEntry.mjs" | cut -c1-8)
HASHED_NAME="remoteEntry-${HASH}.mjs"
mv "$SCRIPT_DIR/$DEPLOY_DIR/remoteEntry.mjs" "$SCRIPT_DIR/$DEPLOY_DIR/$HASHED_NAME"

# Update manifest to point to hashed entrypoint
cat > "$SCRIPT_DIR/$DEPLOY_DIR/manifest.json" <<MANIFEST
{
  "entrypoint": "$HASHED_NAME",
  "config": {}
}
MANIFEST
echo "[hash] remoteEntry.mjs → $HASHED_NAME"

# Deploy
echo "[sync] -> $HOST:$REMOTE_BASE/web-extensions/$APP/"
ssh "root@$HOST" "mkdir -p $REMOTE_BASE/web-extensions/$APP"
rsync -avz --delete "$SCRIPT_DIR/$DEPLOY_DIR/" "root@$HOST:$REMOTE_BASE/web-extensions/$APP/"

# Restart OpenCloud so it re-reads manifest.json (picks up new entrypoint hash)
echo "[restart] podman compose up -d opencloud"
ssh "root@$HOST" "cd $REMOTE_BASE && podman compose up -d opencloud 2>&1 | tail -3"

echo ""
echo "=== $APP published ==="
