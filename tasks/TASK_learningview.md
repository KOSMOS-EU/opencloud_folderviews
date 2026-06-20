# TASK: Learning View — Themen mit Aufgaben + "Leaf is Application"

## Ziel

Verwaltung von Lernthemen mit strukturierten Aufgaben im OpenCloud FolderView System.
Basiert auf dem bestehenden Metro/Tree/Element View mit neuen Typ-Schemas und
einem "Leaf is Application" Pattern für den nahtlosen Editor-Start.

## Kernkonzept: "Leaf is Application"

Ein Ordner mit bestimmtem Typ (z.B. `_type_thema`) wird nicht als Ordner geöffnet,
sondern startet eine Web-App (Editor/Viewer). Das Schema steuert das Verhalten:

```json
{
  "label": "Thema",
  "icon": "book-open",
  "app": "learn-editor",
  "appEntry": "seite.md",
  "isLeaf": true,
  "children": []
}
```

- `isLeaf: true` — Metro-Kachel öffnet App statt Ordner-Navigation
- `app: "learn-editor"` — Welche registrierte Web-App gestartet wird
- `appEntry: "seite.md"` — Einstiegsdatei die der App übergeben wird
- Generisch einsetzbar für andere Leaf-Apps (Formulare, Dashboards, etc.)

## Datenstruktur

### Space "Lernen"
```
Lernen/
  _type_lernplan
  .views/
    lernplan.json           ← Typ-Schema für Lernplan-Ebenen
    thema.json              ← Typ-Schema mit isLeaf + app
  01 Deutsch/
    _type_lernplan
    oy.fileReference: "01"
    oy.color: "#8B1A1A"     ← Farbcode für Metro-Kachel
    oy.note: "Rechtschreibung, Grammatik, Aufsätze"
    01 Satzreihe-Satzgefüge/
      _type_lernplan
      oy.fileReference: "01.01"
      01 Haupt- und Nebensätze/
        _type_thema                    ← LEAF: öffnet learn-editor
        oy.fileReference: "01.01.01"
        seite.md                       ← Titel + Markdown-Beschreibung
        01_erklaervideo.task           ← Aufgabe als JSON
        02_vorwissen.task
        03_arbeitsblatt.task
        attachments/                   ← Anhänge (PDFs, Bilder)
          AB1.pdf
      02 Satzreihen kennen/
        _type_thema
        ...
  02 Mathematik/
    _type_lernplan
    oy.color: "#2E7D32"
    ...
```

### `.views/lernplan.json`
```json
{
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
}
```

### `.views/thema.json`
```json
{
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
}
```

### `.task` Dateiformat (JSON)
```json
{
  "version": 1,
  "type": "book",
  "title": "Deutschbuch 7",
  "description": "Lies den Infotext im Schulbuch auf **Seite 219**.",
  "icon": "book-open",
  "color": "#1565C0",
  "badgeIcon": null,
  "level": null,
  "attachments": [
    { "name": "AB1.pdf", "path": "attachments/AB1.pdf" }
  ],
  "socialForm": "Einzelarbeit",
  "submissionForm": "keine",
  "effort": "45 Minuten",
  "correctionForm": "Selbstkorrektur",
  "solution": ""
}
```

### Aufgaben-Typen
| Typ | Icon | Default-Farbe | Beschreibung |
|-----|------|---------------|--------------|
| book | book-open | #1565C0 | Buch |
| workbook | book | #1565C0 | Arbeitsheft |
| worksheet | file-text | #4527A0 | Arbeitsblatt |
| digital | monitor | #4527A0 | Digitaler Inhalt |
| weblink | globe | #00838F | Weblink |
| collection | grid | #00838F | Sammlung |
| learningapp | cpu | #2E7D32 | LearningApp |
| selftest | check-square | #2E7D32 | Selbsttest |
| survey | help-circle | #2E7D32 | Umfrage |
| creative | edit-3 | #C62828 | Kreativ |
| video | play-circle | #1565C0 | Video |

## Sortierung

- Nummerierung analog Aktenzeichen in Metadata (`oy.fileReference`)
- Sortierung per Drag&Drop im Metro/Tree View (ändert Nummerierung)
- Re-Nummerierung: verschiebt Sequenznummern der Geschwister
- Auch nutzbar für Intranet/Element View (generisches Feature)

## Metro-Kachel Erweiterungen

### Farbige Kacheln
- `oy.color` Metadata → Hintergrundfarbe der Metro-Kachel
- Fallback: Standard-Kachel-Farbe
- Nur bei Typed Folders (Lernplan-Ebenen)

### Beschreibung unter Titel
- `oy.note` Metadata → Kurztext unter dem Kachel-Titel
- Graue Schrift, max 2 Zeilen

### Leaf-Kachel Verhalten
- Schema `isLeaf: true` → Klick öffnet App statt Ordner
- Metro-Kachel zeigt Aufgaben-Anzahl als Badge
- Doppelklick oder Drei-Punkte → "Bearbeiten" startet App

## Learn-Editor (Web-App Extension)

### Registrierung
- Eigene OpenCloud Web-App (Module Federation)
- Registriert sich als Handler für `_type_thema` Ordner
- Oder: registriert sich für `.learn`/`.task` MIME-Types

### Editor-Layout (near-WYSIWYG)
```
┌─────────────────────────────────────────┐
│ [Nummer] Thema                          │
│ ────────────────────────────────────    │
│ Titel: [________________]               │
│                                         │
│ Beschreibung (Markdown):                │
│ ┌─────────────────────────────────────┐ │
│ │ ## Hier lernst du:                  │ │
│ │ - Du lernst die Merkmale von...     │ │
│ │ - Du lernst die Unterschiede...     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Aufgaben:                               │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │ 📖   │ │ 🎬   │ │ 📄   │ │ ➕   │    │
│ │Buch  │ │Video │ │AB 1  │ │Neue  │    │
│ └──────┘ └──────┘ └──────┘ └──────┘    │
│                                         │
│ [Speichern]  [Vorschau]                 │
└─────────────────────────────────────────┘
```

### Aufgaben-Dialog
- Typ-Auswahl: 3x3 Grid mit Icons (wie im Design)
- Farbe: Color-Picker
- Icon + Zusatz-Icon: Icon-Picker
- Name, Beschreibung (Markdown)
- Anhänge: Datei-Upload in `attachments/` Unterordner
- Sozialform: Dropdown (Einzelarbeit, Partnerarbeit, Gruppenarbeit)
- Abgabeform: Dropdown
- Zeitaufwand: Dropdown
- Korrekturform: Dropdown
- Lösungstext: Textarea

### Speichern
- `seite.md` → Titel + Beschreibung als Markdown mit YAML-Frontmatter
- `*.task` → Aufgaben als einzelne JSON-Dateien
- Nummerierung: `01_name.task`, `02_name.task`, ...
- Per WebDAV PUT in den Thema-Ordner

## Classes-Integration (Abgrenzung)

Folgendes ist NICHT Teil dieses Tasks, sondern des classes-Dienstes:
- Schüler-Konten und QR-Codes
- Schüler-Ansicht der Aufgaben
- Sichtbarkeit (pro Schüler, Zeitraum)
- Aufgaben-Abgabe und Korrektur
- Kalender-Ansicht

Was hier vorbereitet wird:
- `classes/` Ordner im Space-Root mit `.md` Dateien (Nutzer-Listen)
- Jede Zeile = eine Nutzerkennung aus dem classes-Dienst
- Keine personenbezogenen Daten im Space

## Implementierungsreihenfolge

### Phase 1: Schema + Metro-Farben
- [ ] `TypedFolderSchema` um `app`, `appEntry`, `isLeaf`, `oy.color` erweitern
- [ ] Metro-View: Kachel-Hintergrundfarbe aus `oy.color`
- [ ] Metro-View: Beschreibung aus `oy.note`
- [ ] Space "Lernen" mit Testdaten anlegen

### Phase 2: Leaf is Application
- [ ] Metro-View: `isLeaf` erkennen → Klick startet App statt Navigation
- [ ] `triggerDefaultAction` oder custom App-Starter für Leaf-Ordner
- [ ] Schema-Lookup beim Klick auf Kachel

### Phase 3: .task Format + Thema-Ordner
- [ ] `.task` JSON-Format definieren
- [ ] `seite.md` mit YAML-Frontmatter für Titel/Beschreibung
- [ ] Thema-Ordner-Erstellung per Toolbar-Button

### Phase 4: Learn-Editor Web-App
- [ ] Neues Extension-Repo oder in folderviews integriert
- [ ] Registrierung als App für `_type_thema` / `.task`
- [ ] Titel + Markdown-Editor (textarea oder tiptap)
- [ ] Aufgaben-Grid mit Kacheln
- [ ] Aufgaben-Dialog (Typ, Farbe, Icon, Felder)
- [ ] Speichern per WebDAV

### Phase 5: Sortierung (generisch)
- [ ] Drag&Drop in Metro/Tree View
- [ ] Re-Nummerierung der `oy.fileReference` nach Sortierung
- [ ] Auch für Intranet/Element View nutzbar

### Phase 6: Classes-Vorbereitung
- [ ] `classes/` Ordner-Struktur
- [ ] `.md` Dateien mit Nutzerkennungen
- [ ] API-Schnittstelle zum classes-Dienst (Stub)
