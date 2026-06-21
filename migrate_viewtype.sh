#!/bin/bash
set -euo pipefail

# migrate_viewtype.sh — Einmalig: .views/*.json → .views/*.viewtype umbenennen
#
# Usage:
#   ./migrate_viewtype.sh <space-webdav-url> <user:password>
#
# Example:
#   ./migrate_viewtype.sh "https://cloud.example.com/dav/spaces/STORAGEID%24SPACEID" "Tester:password"

SPACE_URL="${1:?Usage: $0 <space-webdav-url> <user:password>}"
AUTH="${2:?Usage: $0 <space-webdav-url> <user:password>}"
SPACE_URL="${SPACE_URL%/}"

TYPES=(aktenplan akte vorgang register lernplan thema div)

echo "=== Migrating .views/*.json → .views/*.viewtype ==="

for type in "${TYPES[@]}"; do
  CODE=$(curl -s -k -u "$AUTH" -o /dev/null -w "%{http_code}" "$SPACE_URL/.views/${type}.json")
  if [ "$CODE" = "200" ]; then
    MOVE_CODE=$(curl -s -k -u "$AUTH" -X MOVE \
      -H "Destination: ${SPACE_URL}/.views/${type}.viewtype" \
      "$SPACE_URL/.views/${type}.json" -o /dev/null -w "%{http_code}")
    case $MOVE_CODE in
      201|204) echo "[ok] ${type}.json → ${type}.viewtype" ;;
      *)       echo "[err] ${type}.json MOVE → $MOVE_CODE" ;;
    esac
  else
    echo "[skip] ${type}.json not found ($CODE)"
  fi
done

echo "=== Done ==="
