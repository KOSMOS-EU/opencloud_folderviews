# Lehrkraft-Part: Was haben wir, was fehlt?

## ✅ Fertig

| Feature | Branch | Status |
|---------|--------|--------|
| Lernplan/Thema Hierarchie (_type_lernplan, _type_thema) | learningview | deployed |
| Metro-View: Farbige Kacheln (oy.color) | learningview | deployed |
| Metro-View: Beschreibung (oy.note) | learningview | deployed |
| Metro-View: Sortierung nach Nummer (oy.fileReference) | learningview | deployed |
| Leaf is Application (oy.app → LearnEditor) | learningview | deployed |
| LearnEditor: seite.md + .task Dateien anzeigen/bearbeiten | learningview | deployed |
| CreateDialog: Neuer Lernbereich/Thema mit Farbe + Beschreibung | learningview | deployed |
| Auto-Nummerierung beim Anlegen | learningview | deployed |
| Auto-Reload nach Anlegen | learningview | deployed |
| Toolbar: Neuer Lernbereich (Root) / Neues Thema (Level 1+) | learningview | deployed |
| .classes/ Klassendateien (Token-Format, Parser, Composable) | learningview | deployed |
| FolderSettings Sidebar im Drei-Punkte-Menü | type-settings | deployed |
| PROPFIND extraProps: fileReference, color, note, app | learningview | deployed |
| 160 Beispiel-Aufgaben (8 Fächer OS 7-10) | learningview | im Repo |
| deploy_content.sh + setup_lernen.sh | learningview | im Repo |
| Protect/Unprotect (schema-gesteuert) | learningview | deployed |

## 🔧 Fehlt / Verbesserungsbedarf

### Priorität 1 — Muss für Lehrkraft-Alltag

#### 1.1 LearnEditor: Aufgaben per Drag&Drop sortieren
- Aktuell: Reihenfolge = Dateiname (01_, 02_, ...)
- Fehlt: Drag&Drop in der Aufgaben-Grid zum Umsortieren
- Beim Speichern: Dateien umbenennen (01_, 02_, ...)

#### 1.2 LearnEditor: Datei-Upload für Anhänge
- Aktuell: .task hat `attachments` Array, aber kein Upload-UI
- Fehlt: Datei-Upload-Button pro Aufgabe → speichert in attachments/ Ordner
- PDF, Bilder, Arbeitsblätter hochladen

#### 1.3 Thema umbenennen / löschen
- Aktuell: Nur über OpenCloud Dateimanager möglich
- Fehlt: Umbenennen/Löschen im Metro-View oder Context-Menu
- Bei Löschen: Frage ob sicher, dann Ordner + _type_ + Inhalt löschen

#### 1.4 Lernbereich umbenennen / Farbe ändern
- Aktuell: FolderSettings Sidebar funktioniert
- Aber: Name ändern geht nicht über FolderSettings (ist WebDAV MOVE)
- Fehlt: Rename-Aktion im Context-Menu oder FolderSettings

#### 1.5 Breadcrumb / Navigation zurück
- Aktuell: Metro-View hat keinen sichtbaren Zurück-Pfad
- Browser-Zurück funktioniert, aber kein Breadcrumb
- Fehlt: Pfad-Anzeige "Lernen > Deutsch > Satzreihe-Satzgefüge"

### Priorität 2 — Wichtig für Workflow

#### 2.1 Klassen-Verwaltungs-UI
- Aktuell: .classes/ Dateien manuell per Texteditor bearbeiten
- Fehlt: UI zum Verwalten der Klassenlisten
  - Schüler hinzufügen/entfernen
  - Import aus CSV
  - Übersicht: welche Klassen, wie viele Schüler

#### 2.2 Thema duplizieren
- Lehrkraft will ein Thema als Vorlage kopieren
- Fehlt: "Duplizieren" im Context-Menu
- Kopiert Ordner + seite.md + .task Dateien + attachments

#### 2.3 Themen-Vorschau (Read-Only)
- Lehrkraft will sehen wie der Schüler das Thema sieht
- Fehlt: Vorschau-Modus im LearnEditor (ohne Edit-Buttons)
- Oder: Link "Als Schüler anzeigen" → classes-Vorschau

#### 2.4 Mehrere Themen gleichzeitig verschieben
- Lehrkraft will Themen zwischen Lernbereichen verschieben
- Aktuell: Nur per Dateimanager (Drag&Drop in Tree-View)
- Fehlt: Move-Action im Metro-View

### Priorität 3 — Nice-to-have

#### 3.1 Aufgaben-Vorlagen / Aufgaben-Pool
- Lehrkraft will aus einem Pool vorgefertigter Aufgaben wählen
- z.B. "Erklärvideo zu Thema X" → .task Template einfügen
- Könnte als .views/templates/ Ordner im Space liegen

#### 3.2 Kompetenz-Tags an Aufgaben
- .task erweitern um `competencies: ["KMK-2.1", "Selbstregulation"]`
- UI: Dropdown/Tags im Aufgaben-Dialog
- Kompetenz-Katalog als JSON im Space

#### 3.3 Themen zeitlich freigeben
- oy.visibleFrom / oy.visibleUntil Metadata
- UI: Datumfelder im FolderSettings oder CreateDialog
- Nur relevant wenn classes-Dienst die Sichtbarkeit prüft

#### 3.4 Statistik-Ansicht
- Wie viele Themen/Aufgaben pro Lernbereich
- Übersicht: Lernbereiche ohne Themen (leer)
- Aufgaben-Typen-Verteilung (wie viel Video, wie viel Arbeitsblatt)

#### 3.5 Export / Import
- Space-Inhalte als ZIP exportieren
- Import in einen anderen Space (andere Schule)
- Oder: Space klonen

## Zusammenfassung

| Kategorie | Fertig | Fehlt P1 | Fehlt P2 | Fehlt P3 |
|-----------|--------|----------|----------|----------|
| Struktur (Lernplan/Thema) | ✅ | - | - | - |
| Metro-View (Farbe/Sort/Leaf) | ✅ | Breadcrumb | - | - |
| LearnEditor (Thema bearbeiten) | ✅ | Drag&Drop, Upload | Vorschau | Templates |
| Ordner-Management (Neu/Settings) | ✅ | Rename, Delete | Duplizieren, Move | Export |
| Klassen (.classes/) | ✅ Basis | - | Verwaltungs-UI | - |
| Aufgaben (.task Format) | ✅ | - | - | Kompetenz-Tags |
| Content (160 Beispiele) | ✅ | - | - | - |
| Zeitsteuerung | ❌ | - | - | oy.visibleFrom |

**Fazit**: Die Grundstruktur steht. Für den Lehrkraft-Alltag fehlen vor allem:
1. Datei-Upload für Anhänge im LearnEditor
2. Drag&Drop-Sortierung der Aufgaben
3. Umbenennen/Löschen von Themen
4. Breadcrumb-Navigation
5. Klassen-Verwaltungs-UI
