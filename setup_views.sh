#!/bin/bash
set -euo pipefail

# setup_views.sh — Richtet .views/<type>.json Schemas in einem Space ein
#
# Usage:
#   ./setup_views.sh <space-webdav-url> <user:password>
#
# Example:
#   ./setup_views.sh "https://cloud.brandis.eu/dav/spaces/f7e671d7-36e5-493f-b0c7-ffe5ee4319a5%24f9f939a9-5910-46b8-9abb-eb54e6628b2a" "Tester:password"

SPACE_URL="${1:?Usage: $0 <space-webdav-url> <user:password>}"
AUTH="${2:?Usage: $0 <space-webdav-url> <user:password>}"

SPACE_URL="${SPACE_URL%/}"

echo "=== Setting up .views/ in $SPACE_URL ==="

# Create .views/ directory
CODE=$(curl -s -k -u "$AUTH" -X MKCOL "$SPACE_URL/.views" -o /dev/null -w "%{http_code}")
case $CODE in
  201) echo "[ok] .views/ created" ;;
  405) echo "[ok] .views/ already exists" ;;
  *)   echo "[warn] MKCOL .views/ → $CODE" ;;
esac

# Upload schema files
upload() {
  local name="$1" json="$2"
  CODE=$(curl -s -k -u "$AUTH" -X PUT -H 'Content-Type: application/json' \
    -d "$json" "$SPACE_URL/.views/${name}.json" -o /dev/null -w "%{http_code}")
  case $CODE in
    201|204) echo "[ok] ${name}.json" ;;
    *)       echo "[warn] ${name}.json → $CODE" ;;
  esac
}

upload aktenplan '{
  "label": "Aktenplan",
  "icon": "archive",
  "children": {
    "protected": ["aktenplan"],
    "shielded": ["akte"],
    "default": ["aktenplan", "akte"]
  },
  "columns": ["name", "typ", "anzahl"]
}'

upload akte '{
  "label": "Akte",
  "icon": "folder-open",
  "children": ["vorgang"],
  "columns": ["name", "status", "abgelegt-am"]
}'

upload vorgang '{
  "label": "Vorgang",
  "icon": "file-list",
  "children": ["register"],
  "columns": ["name", "version", "abgelegt-am"]
}'

upload register '{
  "label": "Register",
  "icon": "bookmark",
  "children": [],
  "columns": ["name", "abgelegt-am"]
}'

# Verify
echo ""
echo "=== Verifying ==="
for type in aktenplan akte vorgang register; do
  CODE=$(curl -s -k -u "$AUTH" -o /dev/null -w "%{http_code}" "$SPACE_URL/.views/${type}.json")
  echo "  ${type}.json → $CODE"
done

echo ""
echo "=== Done ==="
echo "Schemas are at .views/*.json (hidden from listing, readable by path)"
