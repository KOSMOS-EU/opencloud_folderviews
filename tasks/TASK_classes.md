# TASK: Schülerdaten — .classes/ im Lernen-Space

## Konzept

Schülerkennungen werden als einfache Textdateien im Space gespeichert.
Keine personenbezogenen Daten — nur alphanumerische Tokens, die der
externe classes-Dienst auflöst.

## Ablagestruktur

```
Lernen/
  .classes/
    klasse_2025.md
    klasse_2026.md
    klasse_2027.md
    archiv/
      klasse_2023.md
      klasse_2024.md
```

## Dateiformat `klasse_YYYY.md`

```markdown
# Klasse 7a — Schuljahr 2025/26
# Klassenlehrerin: Frau Müller

anna.schmidt
werner
susi
strolch
roy_robsen    # ergänzt am 15.09.
maria.garcia
# tim.weber   # abgemeldet 01.12.
lena_fischer
max.mustermann
```

### Regeln

- **Eine Kennung pro Zeile** — alphanumerisch, Punkt/Unterstrich/Bindestrich erlaubt
- **`#` am Zeilenanfang** = Kommentarzeile (ignoriert beim Parsen)
- **`#` nach Kennung** = Inline-Kommentar (nur für Menschen, wird ignoriert)
- **Leerzeilen** werden ignoriert
- **Sortierung** = Reihenfolge in der Datei (manuell oder alphabetisch)
- **Deaktivieren** = Zeile auskommentieren (`# kennung`)
- **Dateiname** = `klasse_YYYY.md` wobei YYYY das Einschulungsjahr ist
- **Header** (optionale `#`-Zeilen am Anfang) = Klasseninfo für Menschen

### Parser-Logik (Pseudocode)

```
lines = file.split('\n')
tokens = []
for line in lines:
    stripped = line.split('#')[0].trim()   // alles nach # entfernen
    if stripped.length > 0 and stripped.match(/^[a-zA-Z0-9._-]+$/):
        tokens.push(stripped)
return tokens
```

## Wer darf was?

| Rolle | .classes/ lesen | .classes/ schreiben |
|-------|----------------|-------------------|
| Manager (Lehrer) | ✅ | ✅ |
| Schüler | ❌ | ❌ |
| classes-Dienst | ✅ (Service Account) | ❌ |

- `.classes/` ist ein Dotfile-Ordner → im normalen Datei-Listing unsichtbar
- Zugriff per WebDAV-Pfad direkt möglich (wie `.views/`)
- Kein Protect/Immutable nötig — normaler Schreibschutz über Space-Rollen reicht

## Integration mit classes-Dienst

Der classes-Dienst (separater Microservice) nutzt die Token-Listen:

1. **Liest** `.classes/klasse_YYYY.md` per WebDAV (Service Account)
2. **Mappt** Tokens auf interne Schüler-Konten (QR-Code-Login etc.)
3. **Steuert** Sichtbarkeit von Themen pro Klasse/Schüler
4. **Akzeptiert** Aufgaben-Abgaben und speichert sie extern

Der Lernen-Space selbst enthält **keine** Schülerdaten, Abgaben oder
Bewertungen — nur die Token-Referenzen.

## UI im Learn-Editor

### Klassen-Zuordnung (spätere Phase)

Im Thema-Editor könnte ein Tab "Klassen" erscheinen:

```
┌─────────────────────────────────────┐
│ Klassen-Zuordnung                   │
│                                     │
│ ☑ klasse_2025  (12 Schüler)        │
│ ☐ klasse_2026  (15 Schüler)        │
│ ☑ klasse_2027  (13 Schüler)        │
│                                     │
│ Sichtbarkeit: ● alle  ○ gewählte   │
│ Zeitraum: [01.09.2025] - [30.06.26]│
└─────────────────────────────────────┘
```

Diese Zuordnung wird **nicht** im Space gespeichert, sondern im
classes-Dienst (der die Space-Referenz + Thema-Pfad kennt).

## Klassen-Verwaltung im Space

### Einfache Variante (Phase 1)

- Lehrer erstellt/bearbeitet `.classes/klasse_YYYY.md` manuell
  (über Texteditor in OpenCloud oder per Datei-Upload)
- Kein spezielles UI nötig — ist eine Textdatei

### Komfort-Variante (Phase 2)

- Button "Klassen verwalten" im Lernen-Space-Root
- Einfacher Editor: Liste von Kennungen, Hinzufügen/Entfernen
- Import aus CSV/Excel
- Validierung: keine Duplikate, erlaubte Zeichen

## Implementierungsreihenfolge

### Phase 1: Datenformat + manuelle Verwaltung
- [ ] `.classes/` Ordner beim Space-Setup anlegen (setup_lernen.sh)
- [ ] Beispiel-Klassen in Testdaten (deploy_content.sh)
- [ ] Parser-Funktion `parseClassFile(content: string): string[]`
- [ ] Composable `useClasses(space)` — lädt und parst Klassendateien

### Phase 2: Klassen-Liste im UI
- [ ] Sidebar oder Dialog "Klassen" im Learn-Editor
- [ ] Klassenauswahl pro Thema (welche Klassen sehen dieses Thema?)
- [ ] Speicherung der Zuordnung (classes-Dienst oder im Space?)

### Phase 3: classes-Dienst Anbindung
- [ ] Service Account für WebDAV-Zugriff auf .classes/
- [ ] API: GET /classes/{spaceId}/tokens → Liste aller Token
- [ ] API: GET /classes/{spaceId}/klasse/{year} → Token einer Klasse
- [ ] Schüler-Login per Token/QR-Code
- [ ] Sichtbarkeitssteuerung pro Thema

## Offene Fragen

- Sollen Klassen-Dateien versioniert werden (OpenCloud-Versioning)?
- Braucht es ein Archiv-Konzept oder reicht Umbenennen/Löschen?
- Wie wird die Zuordnung Thema↔Klasse gespeichert?
  Option A: Metadata am Thema-Ordner (`oy.classes: "2025,2027"`)
  Option B: Separate Datei `.classes/zuordnung.json`
  Option C: Nur im classes-Dienst (kein Space-Speicher)
- Mehrere Klassen pro Jahrgang? (7a, 7b) → `klasse_2025_7a.md`?
