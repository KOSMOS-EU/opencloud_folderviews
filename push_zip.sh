#!/bin/bash
set -euo pipefail

# Build folderviews web extension and push as ZIP to Codeberg Generic Packages.
#
# Usage:
#   ./push_zip.sh                    # auto-tag with timestamp
#   TAG=1.0.0 ./push_zip.sh         # explicit tag
#
# Requires: CODEBERG_TOKEN env var (or in ~/.codeberg-token)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/DIST"

REGISTRY="codeberg.org"
OWNER="kosmos-eu"
PACKAGE="${APP}-web"
TAG="${TAG:-$(date +%Y%m%d-%H%M)}"

# Token
if [ -z "${CODEBERG_TOKEN:-}" ] && [ -f ~/.codeberg-token ]; then
    CODEBERG_TOKEN="$(cat ~/.codeberg-token)"
fi
: "${CODEBERG_TOKEN:?Set CODEBERG_TOKEN or create ~/.codeberg-token}"

echo "=== Build & Push: ${PACKAGE}:${TAG} ==="

# Build
echo "[build] $BUILD_CMD"
(cd "$SCRIPT_DIR" && eval "$BUILD_CMD")

# Verify
if [ ! -f "$SCRIPT_DIR/$DEPLOY_DIR/manifest.json" ]; then
    echo "ERROR: $DEPLOY_DIR/manifest.json not found"
    exit 1
fi

# Create ZIP
TMPZIP="/tmp/${PACKAGE}-${TAG}.zip"
rm -f "$TMPZIP"
(cd "$SCRIPT_DIR/$DEPLOY_DIR" && zip -r "$TMPZIP" .)
ZIP_SIZE="$(du -h "$TMPZIP" | cut -f1)"
echo "[zip] $ZIP_SIZE"

# Push to Codeberg Generic Packages
UPLOAD_URL="https://${REGISTRY}/api/packages/${OWNER}/generic/${PACKAGE}/${TAG}/${PACKAGE}.zip"
echo "[push] $UPLOAD_URL"
curl -sf -X PUT "$UPLOAD_URL" \
    -H "Authorization: token ${CODEBERG_TOKEN}" \
    --upload-file "$TMPZIP"

echo ""
echo "=== Pushed: ${PACKAGE}:${TAG} ==="
echo ""
echo "Deploy with:"
echo "  deploy_zip.sh --tag ${TAG}"
