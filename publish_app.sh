#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/DIST"

REMOTE_BASE="${DATAPATH:?Set DATAPATH in DIST}"

echo "=== Publish: $APP ==="

# Build (production mode: minified + content-hashed)
echo "[build] $BUILD_CMD"
(cd "$SCRIPT_DIR" && eval "$BUILD_CMD")

# Verify manifest exists and has entrypoint
if [ ! -f "$SCRIPT_DIR/$DEPLOY_DIR/manifest.json" ]; then
    echo "ERROR: $DEPLOY_DIR/manifest.json not found"
    exit 1
fi
ENTRYPOINT=$(python3 -c "import json; print(json.load(open('$SCRIPT_DIR/$DEPLOY_DIR/manifest.json'))['entrypoint'])")
echo "[verify] entrypoint: $ENTRYPOINT"

# Deploy
echo "[sync] -> $HOST:$REMOTE_BASE/web-extensions/$APP/"
ssh "root@$HOST" "mkdir -p $REMOTE_BASE/web-extensions/$APP"
rsync -avz --delete "$SCRIPT_DIR/$DEPLOY_DIR/" "root@$HOST:$REMOTE_BASE/web-extensions/$APP/"

# Restart OpenCloud so it re-reads manifest.json (picks up new entrypoint hash)
echo "[restart] podman compose up -d opencloud"
ssh "root@$HOST" "cd $REMOTE_BASE && podman compose up -d opencloud 2>&1 | tail -3"

echo ""
echo "=== $APP published ==="
