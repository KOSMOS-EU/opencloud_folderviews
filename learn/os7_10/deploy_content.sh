#!/bin/bash
set -euo pipefail

# deploy_content.sh — Deploys OS 7-10 learning content to an OpenCloud Space
#
# Reads server config from ../../DIST (HOST) and uses Graph+WebDAV APIs.
#
# Usage:
#   ./deploy_content.sh <user:password> [space-name]
#
# Example:
#   ./deploy_content.sh "Tester:Tester" "Lernen"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_FILE="$SCRIPT_DIR/../../DIST"

if [ ! -f "$DIST_FILE" ]; then
  echo "ERROR: DIST file not found at $DIST_FILE"
  echo "Create it with HOST=cloud.example.com"
  exit 1
fi

source "$DIST_FILE"
AUTH="${1:?Usage: $0 <user:password> [space-name]}"
SPACE_NAME="${2:-Lernen}"
BASE_URL="https://${HOST:?HOST not set in DIST}"

echo "=== Deploying OS 7-10 content to $BASE_URL ==="
echo "    Space: $SPACE_NAME"
echo "    Auth:  ${AUTH%%:*}"
echo ""

# --- Find or create space ---
SPACE_ID=$(curl -s -k -u "$AUTH" "$BASE_URL/graph/v1.0/drives" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
for d in data.get('value', []):
    if d.get('name') == '$SPACE_NAME' and d.get('driveType') == 'project':
        print(d['id'])
        break
" 2>/dev/null || true)

if [ -z "$SPACE_ID" ]; then
  echo "[create] Space '$SPACE_NAME'..."
  SPACE_ID=$(curl -s -k -u "$AUTH" -X POST "$BASE_URL/graph/v1.0/drives" \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"$SPACE_NAME\",\"driveType\":\"project\"}" | \
    python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  echo "[ok] Created space: $SPACE_ID"
else
  echo "[ok] Found space: $SPACE_ID"
fi

# URL-encode the space ID ($ → %24)
SPACE_ID_ENC=$(echo "$SPACE_ID" | sed 's/\$/%24/g')
SPACE_URL="$BASE_URL/dav/spaces/$SPACE_ID_ENC"

# --- Helper functions ---
mkfolder() {
  local path="$1"
  local encoded=$(python3 -c "from urllib.parse import quote; print(quote('$path', safe='/'))")
  local code=$(curl -s -k -u "$AUTH" -X MKCOL "$SPACE_URL/$encoded" -o /dev/null -w "%{http_code}")
  case $code in
    201) echo "  [mkdir] $path" ;;
    405) ;; # already exists
    *)   echo "  [warn] MKCOL $path → $code" ;;
  esac
}

putfile() {
  local path="$1" file="$2"
  local encoded=$(python3 -c "from urllib.parse import quote; print(quote('$path', safe='/'))")
  local code=$(curl -s -k -u "$AUTH" -X PUT -T "$file" "$SPACE_URL/$encoded" -o /dev/null -w "%{http_code}")
  case $code in
    201|204) ;; # ok
    *)       echo "  [warn] PUT $path → $code" ;;
  esac
}

putcontent() {
  local path="$1" content="$2"
  local encoded=$(python3 -c "from urllib.parse import quote; print(quote('$path', safe='/'))")
  local code=$(curl -s -k -u "$AUTH" -X PUT -H 'Content-Type: application/octet-stream' \
    -d "$content" "$SPACE_URL/$encoded" -o /dev/null -w "%{http_code}")
  case $code in
    201|204) ;; # ok
    *)       echo "  [warn] PUT $path → $code" ;;
  esac
}

get_fileid() {
  local path="$1"
  local encoded=$(python3 -c "from urllib.parse import quote; print(quote('$path', safe='/'))")
  curl -s -k -u "$AUTH" -X PROPFIND -H 'Depth: 0' \
    -H 'Content-Type: application/xml' \
    -d '<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:prop><oc:fileid/></d:prop></d:propfind>' \
    "$SPACE_URL/$encoded" | grep -oP '<oc:fileid>[^<]+' | head -1 | sed 's/<oc:fileid>//'
}

set_meta() {
  local path="$1" json="$2"
  local full_id=$(get_fileid "$path")
  if [ -z "$full_id" ]; then
    echo "  [warn] no fileid for $path"
    return
  fi
  local node_id="${full_id##*!}"
  local item_id="${SPACE_ID}!${node_id}"
  # URL-encode the item ID
  local item_id_enc=$(echo "$item_id" | sed 's/\$/%24/g')
  local space_id_enc=$(echo "$SPACE_ID" | sed 's/\$/%24/g')
  local code=$(curl -s -k -u "$AUTH" -X PUT \
    -H 'Content-Type: application/json' \
    -d "$json" \
    "$BASE_URL/graph/v1beta1/drives/$space_id_enc/items/$item_id_enc/metadata" \
    -o /dev/null -w "%{http_code}")
  case $code in
    200|204) ;; # ok
    *)       echo "  [warn] metadata $path → $code" ;;
  esac
}

# --- Upload schemas ---
echo "=== Uploading schemas ==="
mkfolder ".views"

putcontent ".views/lernplan.viewtype" '{
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

putcontent ".views/thema.viewtype" '{
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
echo "[ok] Schemas uploaded"

# --- Root type marker ---
putcontent "_type_lernplan" ""

# --- Upload subjects ---
echo ""
echo "=== Uploading content ==="

for subj_dir in "$SCRIPT_DIR"/*/; do
  [ -f "$subj_dir/metadata.json" ] || continue

  subj_name=$(python3 -c "import json; print(json.load(open('$subj_dir/metadata.json'))['name'])")
  subj_ref=$(python3 -c "import json; print(json.load(open('$subj_dir/metadata.json'))['ref'])")
  subj_color=$(python3 -c "import json; print(json.load(open('$subj_dir/metadata.json'))['color'])")
  subj_note=$(python3 -c "import json; print(json.load(open('$subj_dir/metadata.json'))['note'])")

  echo ""
  echo "--- $subj_ref $subj_name ---"

  mkfolder "$subj_name"
  putcontent "$subj_name/_type_lernplan" ""

  # Set subject metadata
  set_meta "$subj_name" "{\"oy.fileReference\":\"$subj_ref\",\"oy.color\":\"$subj_color\",\"oy.note\":\"$subj_note\"}"

  # Topics
  topic_idx=0
  for topic_dir in "$subj_dir"/*/; do
    [ -f "$topic_dir/seite.md" ] || continue
    topic_idx=$((topic_idx + 1))

    topic_name=$(basename "$topic_dir")
    topic_ref="$subj_ref.$(printf '%02d' $topic_idx)"

    echo "  $topic_ref $topic_name"

    mkfolder "$subj_name/$topic_name"
    putcontent "$subj_name/$topic_name/_type_thema" ""

    # Upload seite.md
    putfile "$subj_name/$topic_name/seite.md" "$topic_dir/seite.md"

    # Upload .task files
    for task_file in "$topic_dir"/*.task; do
      [ -f "$task_file" ] || continue
      task_name=$(basename "$task_file")
      putfile "$subj_name/$topic_name/$task_name" "$task_file"
    done

    # Set topic metadata (oy.app marks it as leaf for Metro view)
    set_meta "$subj_name/$topic_name" "{\"oy.fileReference\":\"$topic_ref\",\"oy.app\":\"learn-editor\"}"
  done
done

# --- Upload .classes/ ---
echo ""
echo "=== Uploading .classes/ ==="
mkfolder ".classes"

putcontent ".classes/klasse_2024.md" '# Klasse 8a — Schuljahr 2024/25
# Klassenlehrer: Herr Schmidt

anna.schmidt
ben.wagner
clara.hoffmann
david.meyer
emma.schulz
finn.becker
greta.koch
henri.wolf
ida.richter
jan.braun
karla.neumann
leon.schwarz
mia.zimmermann
nico.hartmann
olivia.weber
paul.frank
# quentin.ross   # abgemeldet 15.11.
rosa.lang
simon.kraft
tessa.winter
uwe.bach
viola.stein
wenzel.berg
xenia.roth
yusuf.celik
zoe.lehmann
'
echo "[ok] .classes/klasse_2024.md (25 Schüler)"

echo ""
echo "=== Done ==="
echo "Content deployed to space '$SPACE_NAME' on $HOST"
echo ""
echo "Summary:"
echo "  Subjects: $(find "$SCRIPT_DIR" -name metadata.json | wc -l)"
echo "  Topics:   $(find "$SCRIPT_DIR" -name seite.md | wc -l)"
echo "  Tasks:    $(find "$SCRIPT_DIR" -name '*.task' | wc -l)"
