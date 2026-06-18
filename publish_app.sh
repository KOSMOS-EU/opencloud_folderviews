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

# Deploy
echo "[sync] -> $HOST:$REMOTE_BASE/web-extensions/$APP/"
ssh "root@$HOST" "mkdir -p $REMOTE_BASE/web-extensions/$APP"
rsync -avz --delete "$SCRIPT_DIR/$DEPLOY_DIR/" "root@$HOST:$REMOTE_BASE/web-extensions/$APP/"

echo ""
echo "=== $APP published ==="
