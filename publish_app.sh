#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/DIST"

REMOTE_BASE="${DATAPATH:?Set DATAPATH in DIST}"
APPS_PATH="/var/lib/opencloud/web/assets/apps"

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

# Mount nachtragen (idempotent)
MOUNT="      - ./web-extensions/$APP:$APPS_PATH/$APP:ro"
echo "[config] extensions.yml"
ssh "root@$HOST" "
    if ! grep -q 'web-extensions/$APP:' '$REMOTE_BASE/web_extensions/extensions.yml'; then
        sed -i '/volumes:/a\\$MOUNT' '$REMOTE_BASE/web_extensions/extensions.yml'
        echo '  Mount added'
    else
        echo '  Mount exists'
    fi
"

# Activate
echo "[activate] podman compose up -d opencloud"
ssh "root@$HOST" "cd $REMOTE_BASE && podman compose up -d opencloud 2>&1 | tail -3"

echo ""
echo "=== $APP published ==="
