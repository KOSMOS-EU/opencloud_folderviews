#!/bin/bash
set -euo pipefail

# setup_lernen_testdata.sh — Creates test data in a Lernen space
#
# Usage:
#   ./setup_lernen_testdata.sh <space-webdav-url> <graph-base-url> <space-id> <user:password>
#
# Example:
#   ./setup_lernen_testdata.sh \
#     "https://cloud.example.com/dav/spaces/STORAGEID%24SPACEID" \
#     "https://cloud.example.com" \
#     "STORAGEID\$SPACEID" \
#     "Tester:password"

SPACE_URL="${1:?Usage: $0 <space-webdav-url> <graph-base-url> <space-id> <user:password>}"
BASE_URL="${2:?}"
SPACE_ID="${3:?}"
AUTH="${4:?}"

SPACE_URL="${SPACE_URL%/}"

# Helper: create folder
mkfolder() {
  local path="$1"
  CODE=$(curl -s -k -u "$AUTH" -X MKCOL "$SPACE_URL/$path" -o /dev/null -w "%{http_code}")
  case $CODE in
    201) echo "[ok] mkdir $path" ;;
    405) echo "[ok] exists $path" ;;
    *)   echo "[warn] MKCOL $path → $CODE" ;;
  esac
}

# Helper: create file with content
putfile() {
  local path="$1" content="${2:-}"
  CODE=$(curl -s -k -u "$AUTH" -X PUT -H 'Content-Type: application/octet-stream' \
    -d "$content" "$SPACE_URL/$path" -o /dev/null -w "%{http_code}")
  case $CODE in
    201|204) echo "[ok] put $path" ;;
    *)       echo "[warn] PUT $path → $CODE" ;;
  esac
}

# Helper: set metadata on a folder
setmeta() {
  local folder_path="$1"
  shift
  # Get the folder's item ID via PROPFIND
  local PROPFIND_RESP
  PROPFIND_RESP=$(curl -s -k -u "$AUTH" -X PROPFIND -H 'Depth: 0' \
    -H 'Content-Type: application/xml' \
    -d '<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:prop><oc:fileid/></d:prop></d:propfind>' \
    "$SPACE_URL/$folder_path")
  local FILE_ID
  FILE_ID=$(echo "$PROPFIND_RESP" | grep -oP '<oc:fileid>[^<]+' | head -1 | sed 's/<oc:fileid>//')
  if [ -z "$FILE_ID" ]; then
    echo "[warn] Could not get fileid for $folder_path"
    return
  fi
  # Build the item ID
  local STORAGE_ID="${SPACE_ID%%\$*}"
  local ITEM_ID="${SPACE_ID}!${FILE_ID}"
  # Set metadata via Graph API
  local JSON="$1"
  CODE=$(curl -s -k -u "$AUTH" -X PUT \
    -H 'Content-Type: application/json' \
    -d "$JSON" \
    "$BASE_URL/graph/v1beta1/drives/${SPACE_ID}/items/${ITEM_ID}/metadata" \
    -o /dev/null -w "%{http_code}")
  case $CODE in
    200|204) echo "[ok] metadata $folder_path" ;;
    *)       echo "[warn] metadata $folder_path → $CODE" ;;
  esac
}

echo "=== Creating Lernen test structure ==="

# Root type marker
putfile "_type_lernplan" ""

# === Deutsch ===
mkfolder "01 Deutsch"
putfile "01 Deutsch/_type_lernplan" ""

mkfolder "01 Deutsch/01 Satzreihe-Satzgefüge"
putfile "01 Deutsch/01 Satzreihe-Satzgefüge/_type_lernplan" ""

mkfolder "01 Deutsch/01 Satzreihe-Satzgefüge/01 Haupt- und Nebensätze"
putfile "01 Deutsch/01 Satzreihe-Satzgefüge/01 Haupt- und Nebensätze/_type_thema" ""

# seite.md
putfile "01 Deutsch/01 Satzreihe-Satzgefüge/01 Haupt- und Nebensätze/seite.md" \
'---
title: Haupt- und Nebensätze unterscheiden
---

## Hier lernst du folgende Dinge:

- Du lernst die Merkmale von **Hauptsätzen**.
- Du lernst die Merkmale von **Nebensätzen**.
- Du lernst die **Unterschiede** von Haupt- und Nebensätzen.'

# .task files
putfile "01 Deutsch/01 Satzreihe-Satzgefüge/01 Haupt- und Nebensätze/01_erklaervideo.task" \
'{"version":1,"type":"video","title":"Erklärvideo Teil 1 - Vorwissen","description":"Schau dir das Video an und beantworte die Fragen.","icon":"play-circle","color":"#1565C0","badgeIcon":null,"level":null,"attachments":[],"socialForm":"Einzelarbeit","submissionForm":"keine","effort":"10 Minuten","correctionForm":"Selbstkorrektur","solution":""}'

putfile "01 Deutsch/01 Satzreihe-Satzgefüge/01 Haupt- und Nebensätze/02_vorwissen.task" \
'{"version":1,"type":"learningapp","title":"Vorwissen aktivieren","description":"Bearbeite die LearningApp zu Haupt- und Nebensätzen.","icon":"cpu","color":"#2E7D32","badgeIcon":null,"level":null,"attachments":[],"socialForm":"Einzelarbeit","submissionForm":"keine","effort":"15 Minuten","correctionForm":"Selbstkorrektur","solution":""}'

putfile "01 Deutsch/01 Satzreihe-Satzgefüge/01 Haupt- und Nebensätze/03_arbeitsblatt.task" \
'{"version":1,"type":"worksheet","title":"AB 1 - Haupt- und Nebensätze","description":"Bearbeite das Arbeitsblatt **vollständig** und kontrolliere deine Ergebnisse.","icon":"file-text","color":"#4527A0","badgeIcon":null,"level":null,"attachments":[{"name":"AB1.pdf","path":"attachments/AB1.pdf"}],"socialForm":"Einzelarbeit","submissionForm":"digital","effort":"20 Minuten","correctionForm":"Lehrerkorrektur","solution":""}'

mkfolder "01 Deutsch/01 Satzreihe-Satzgefüge/01 Haupt- und Nebensätze/attachments"

mkfolder "01 Deutsch/01 Satzreihe-Satzgefüge/02 Satzreihen kennen"
putfile "01 Deutsch/01 Satzreihe-Satzgefüge/02 Satzreihen kennen/_type_thema" ""
putfile "01 Deutsch/01 Satzreihe-Satzgefüge/02 Satzreihen kennen/seite.md" \
'---
title: Satzreihen kennen und anwenden
---

## Hier lernst du folgende Dinge:

- Du lernst, was **Satzreihen** sind.
- Du übst das **Erkennen und Bilden** von Satzreihen.'

putfile "01 Deutsch/01 Satzreihe-Satzgefüge/02 Satzreihen kennen/01_schulbuch.task" \
'{"version":1,"type":"book","title":"Deutschbuch 7","description":"Lies den Infotext im Schulbuch auf **Seite 219**.","icon":"book-open","color":"#1565C0","badgeIcon":null,"level":null,"attachments":[],"socialForm":"Einzelarbeit","submissionForm":"keine","effort":"10 Minuten","correctionForm":"Selbstkorrektur","solution":""}'

# === Mathematik ===
mkfolder "02 Mathematik"
putfile "02 Mathematik/_type_lernplan" ""

mkfolder "02 Mathematik/01 Terme und Gleichungen"
putfile "02 Mathematik/01 Terme und Gleichungen/_type_lernplan" ""

mkfolder "02 Mathematik/01 Terme und Gleichungen/01 Terme vereinfachen"
putfile "02 Mathematik/01 Terme und Gleichungen/01 Terme vereinfachen/_type_thema" ""
putfile "02 Mathematik/01 Terme und Gleichungen/01 Terme vereinfachen/seite.md" \
'---
title: Terme vereinfachen
---

## Lernziele:

- Du kannst **gleichartige Terme** zusammenfassen.
- Du beherrschst das **Distributivgesetz**.'

putfile "02 Mathematik/01 Terme und Gleichungen/01 Terme vereinfachen/01_erklaervideo.task" \
'{"version":1,"type":"video","title":"Terme vereinfachen - Erklärvideo","description":"Schau dir das Video aufmerksam an.","icon":"play-circle","color":"#1565C0","badgeIcon":null,"level":null,"attachments":[],"socialForm":"Einzelarbeit","submissionForm":"keine","effort":"12 Minuten","correctionForm":"Selbstkorrektur","solution":""}'

# === Physik ===
mkfolder "03 Physik"
putfile "03 Physik/_type_lernplan" ""

echo ""
echo "=== Setting metadata ==="

setmeta "01 Deutsch" '{"oy.fileReference":"01","oy.color":"#8B1A1A","oy.note":"Rechtschreibung, Grammatik, Aufsätze"}'
setmeta "01 Deutsch/01 Satzreihe-Satzgefüge" '{"oy.fileReference":"01.01"}'
setmeta "01 Deutsch/01 Satzreihe-Satzgefüge/01 Haupt- und Nebensätze" '{"oy.fileReference":"01.01.01"}'
setmeta "01 Deutsch/01 Satzreihe-Satzgefüge/02 Satzreihen kennen" '{"oy.fileReference":"01.01.02"}'

setmeta "02 Mathematik" '{"oy.fileReference":"02","oy.color":"#2E7D32","oy.note":"Algebra, Geometrie, Analysis"}'
setmeta "02 Mathematik/01 Terme und Gleichungen" '{"oy.fileReference":"02.01"}'
setmeta "02 Mathematik/01 Terme und Gleichungen/01 Terme vereinfachen" '{"oy.fileReference":"02.01.01"}'

setmeta "03 Physik" '{"oy.fileReference":"03","oy.color":"#1565C0","oy.note":"Mechanik, Optik, Elektrizität"}'

echo ""
echo "=== Done ==="
echo "Test data created. Open the Space in Metro view to see colored tiles."
