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

# Hash ALL unhashed .mjs files in js/ for cache-busting
# Files already containing a hash (pattern: -XXXXXXXX.mjs) are skipped
echo "[hash] Hashing unhashed chunks..."
for f in "$SCRIPT_DIR/$DEPLOY_DIR/js/"*.mjs; do
    [ -f "$f" ] || continue
    base=$(basename "$f")
    # Skip if already has hash pattern (name-XXXXXXXX.mjs or name-XXXX.mjs)
    if echo "$base" | grep -qE '\-[A-Za-z0-9_]{6,}\.' ; then
        continue
    fi
    HASH=$(md5sum "$f" | cut -c1-8)
    name="${base%.mjs}"
    hashed="${name}-${HASH}.mjs"
    mv "$f" "$SCRIPT_DIR/$DEPLOY_DIR/js/$hashed"
    # Update all references in other files
    find "$SCRIPT_DIR/$DEPLOY_DIR" -name "*.mjs" -exec sed -i "s|$base|$hashed|g" {} +
    echo "  $base → $hashed"
done

# Hash the entrypoint
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
