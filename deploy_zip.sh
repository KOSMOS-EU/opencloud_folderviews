#!/bin/bash
set -euo pipefail

# Deploy folderviews web extension from Codeberg Generic Packages.
#
# Usage:
#   ./deploy_zip.sh                              # latest
#   ./deploy_zip.sh --tag 20260705-1200          # specific version
#   ./deploy_zip.sh --host cloud.os.brandis.parthe.cloud

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/DIST"

REGISTRY="codeberg.org"
OWNER="kosmos-eu"
PACKAGE="${APP}-web"
TAG="latest"
TARGET_DIR="web-extensions/${APP}"
RESTART_CMD="cd ${DATAPATH} && podman compose restart opencloud 2>&1 | tail -3"

while [[ $# -gt 0 ]]; do
  case $1 in
    --tag)      TAG="$2"; shift 2 ;;
    --host)     HOST="$2"; shift 2 ;;
    --no-restart) RESTART_CMD=""; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Resolve "latest" tag
if [ "$TAG" = "latest" ]; then
  echo "[resolve] Fetching latest version of ${PACKAGE}..."
  TAG=$(curl -sf "https://${REGISTRY}/api/v1/packages/${OWNER}?type=generic&q=${PACKAGE}" \
    | python3 -c "
import sys, json
pkgs = [p for p in json.load(sys.stdin) if p['name'] == '${PACKAGE}']
if not pkgs:
    print('NOT_FOUND', file=sys.stderr); sys.exit(1)
print(pkgs[0]['version'])
")
  echo "[resolve] Latest: ${TAG}"
fi

ZIP_URL="https://${REGISTRY}/api/packages/${OWNER}/generic/${PACKAGE}/${TAG}/${PACKAGE}.zip"
REMOTE_DIR="${DATAPATH}/${TARGET_DIR}"

echo "=== Deploy ${PACKAGE}:${TAG} ==="
echo "  from: ${ZIP_URL}"
echo "  to:   ${HOST}:${REMOTE_DIR}"
echo ""

ssh "root@${HOST}" bash -s <<REMOTE
set -euo pipefail
TMPDIR=\$(mktemp -d)
trap 'rm -rf \$TMPDIR' EXIT

echo "[download] ${ZIP_URL}"
curl -sfL -o "\$TMPDIR/pkg.zip" "${ZIP_URL}"

echo "[extract] -> ${REMOTE_DIR}/"
mkdir -p "${REMOTE_DIR}"
rm -rf "${REMOTE_DIR:?}"/*
unzip -qo "\$TMPDIR/pkg.zip" -d "${REMOTE_DIR}/"

echo "[done] \$(find "${REMOTE_DIR}/" -type f | wc -l) files deployed"
REMOTE

if [ -n "$RESTART_CMD" ]; then
  echo "[restart] opencloud"
  ssh "root@${HOST}" "$RESTART_CMD"
fi

echo ""
echo "=== ${PACKAGE}:${TAG} deployed to ${HOST} ==="
