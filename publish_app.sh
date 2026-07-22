#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/DIST"

# nuhost6 support: --nuhost TARGET
NUHOST_TARGET=""
if [[ "${1:-}" == "--nuhost" ]]; then
    NUHOST_TARGET="${2:?--nuhost braucht TARGET-Name}"
    shift 2
fi

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
# nuhost6 deploy
if [ -n "$NUHOST_TARGET" ]; then
    echo "[nuhost] nu packages pull $NUHOST_TARGET $APP"
    ssh "root@$HOST" "nu packages pull $NUHOST_TARGET $APP && nu restart $NUHOST_TARGET"
    echo ""
    echo "=== $APP published (nuhost6) ==="
    exit 0
fi

echo "[sync] -> $HOST:$REMOTE_BASE/web-extensions/$APP/"
ssh "root@$HOST" "mkdir -p $REMOTE_BASE/web-extensions/$APP"
rsync -avz --delete "$SCRIPT_DIR/$DEPLOY_DIR/" "root@$HOST:$REMOTE_BASE/web-extensions/$APP/"

# Restart OpenCloud so it re-reads manifest.json (picks up new entrypoint hash)
echo "[restart] podman compose up -d opencloud"
ssh "root@$HOST" "cd $REMOTE_BASE && podman compose up -d opencloud 2>&1 | tail -3"

echo ""
echo "=== $APP published ==="
