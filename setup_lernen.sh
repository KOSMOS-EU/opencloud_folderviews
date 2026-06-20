#!/bin/bash
set -euo pipefail

# setup_lernen.sh — Richtet .views/ Schemas für einen Lern-Space ein
#
# Usage:
#   ./setup_lernen.sh <space-webdav-url> <user:password>
#
# Example:
#   ./setup_lernen.sh "https://cloud.example.com/dav/spaces/STORAGEID%24SPACEID" "Tester:password"

SPACE_URL="${1:?Usage: $0 <space-webdav-url> <user:password>}"
AUTH="${2:?Usage: $0 <space-webdav-url> <user:password>}"

SPACE_URL="${SPACE_URL%/}"

echo "=== Setting up .views/ for Lernen in $SPACE_URL ==="

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

upload lernplan '{
  "label": "Lernplan",
  "icon": "folder",
  "children": {
    "protected": ["lernplan"],
    "shielded": ["lernplan", "thema"],
    "default": ["lernplan", "thema"]
  },
  "protectButtonVisible": true,
  "fileReferencePattern": "{parentRef}.{seq:02}",
  "metadata": {
    "oy.fileReference": { "label": "Nummer", "type": "string", "auto": true },
    "oy.color": { "label": "Farbe", "type": "string" },
    "oy.note": { "label": "Beschreibung", "type": "string" }
  }
}'

upload thema '{
  "label": "Thema",
  "icon": "book-open",
  "app": "learn-editor",
  "appEntry": "seite.md",
  "isLeaf": true,
  "children": [],
  "fileReferencePattern": "{parentRef}.{seq:02}",
  "metadata": {
    "oy.fileReference": { "label": "Nummer", "type": "string", "auto": true }
  }
}'

# Verify
echo ""
echo "=== Verifying ==="
for type in lernplan thema; do
  CODE=$(curl -s -k -u "$AUTH" -o /dev/null -w "%{http_code}" "$SPACE_URL/.views/${type}.json")
  echo "  ${type}.json → $CODE"
done

echo ""
echo "=== Done ==="
echo "Now create the space structure:"
echo "  1. Upload _type_lernplan to space root"
echo "  2. Create folders like '01 Deutsch/', '02 Mathematik/'"
echo "  3. Upload _type_lernplan into each subject folder"
echo "  4. Set metadata: oy.fileReference, oy.color, oy.note"
echo "  5. Create Thema folders with _type_thema inside"
