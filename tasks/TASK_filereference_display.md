# TASK: Flexible Aktenzeichen-Anzeige (fileReference in Title)

## Ziel

Nutzereinstellung "Aktenzeichen im Titel anzeigen", die Ordnernamen im FolderView
aus dem Aktenzeichen (`oy.fileReference`) und dem Verzeichnisnamen zusammensetzt.
Die Sortierung erfolgt nach dem zusammengesetzten Namen.

## Hintergrund

Aktenzeichen (z.B. "11.03") sind in `oy.fileReference` als Metadatum gespeichert.
Verzeichnisse heissen z.B. "Finanzverwaltung". Mit aktivierter Einstellung wird
daraus "11.03 Finanzverwaltung" — sowohl im Typed-Folder-Header als auch in den
Listeneintraegen der Kindverzeichnisse.

## Ergebnis der Voruntersuchung

### Datenquelle: Metadata-API (nicht PROPFIND)

**PROPFIND liefert KEIN `oy.fileReference`.**
`arbitrary-metadata` und `metadata` kommen als 404 im PROPFIND zurueck.

**Metadata-API liefert `oy.fileReference` korrekt:**
```
GET /graph/v1beta1/drives/{driveID}/items/{driveID}!{nodeID}/metadata
→ { "oy.fileReference": "11.03" }
```

### Testdaten

**Space "77 Aktenplan" → Innere Verwaltung** (Ordner ohne Prefix im Namen):
- `Finanzverwaltung` → metadata: `oy.fileReference: "11.03"`
- `Verwaltungssteuerung und -service` → metadata: `oy.fileReference: "11.05"`

**Space "11 Innere Verwaltung"** (Ordner MIT Prefix im Namen):
- `11.13 Finanzverwaltung` → metadata: `oy.fileReference: "11.13"`

### Konsequenz: N+1 Problem

Pro Folder-Listing muss fuer jedes Kind-Verzeichnis ein separater
Metadata-API-Call erfolgen. Loesung:

1. PROPFIND liefert Listing mit `oc:id` pro Resource
2. Parallel: Metadata-API-Calls fuer alle Folder-Resources (Promise.allSettled)
3. fileReference-Map aufbauen: `Map<resourceId, fileReference>`
4. Anzeigenamen zusammenbauen + sortieren

Batch-Groesse begrenzen (z.B. max 50 parallel) um Server nicht zu ueberlasten.

## Anforderungen

### 1. Nutzereinstellung
- [ ] Toggle "Aktenzeichen im Titel anzeigen" (persistent, localStorage)
- [ ] Erreichbar ueber Extension-Settings oder Toolbar-Button
- [ ] Default: aus
- [ ] Einstellung gilt global (alle Typed-Folder-Views)

### 2. Metadata-Loading
- [ ] Nach PROPFIND: fileReference per Metadata-API laden fuer alle Folder-Kinder
- [ ] Parallel laden mit Promise.allSettled, max 20 concurrent
- [ ] Cache pro Space (fileReference aendert sich selten)
- [ ] Nur laden wenn Einstellung aktiv UND Typed-Folder (isTyped)

### 3. Anzeige im Typed-Folder-Header
- [ ] Wenn aktiv: Header-Titel = `${fileReference} ${folderName}`
- [ ] Wenn inaktiv: Header-Titel = `${folderName}` (wie bisher)

### 4. Anzeige in Listeneintraegen
- [ ] Kindverzeichnisse: Name-Spalte zeigt `${fileReference} ${name}`
      wenn fileReference vorhanden und Einstellung aktiv
- [ ] Dateien (ohne fileReference) bleiben unveraendert
- [ ] Ordner ohne fileReference: nur Name anzeigen

### 5. Sortierung
- [ ] Sortierung nach zusammengesetztem Namen (`${fileReference} ${name}`)
- [ ] Natuerliche Sortierung clientseitig: `Intl.Collator('de', { numeric: true })`
      (1, 2, 10 statt 1, 10, 2)

## Dateien (voraussichtlich)

- `src/composables/useFileReferenceDisplay.ts` — Metadata laden, Cache, Zusammenbau
- `src/composables/useExtensionSettings.ts` — Persistente Nutzereinstellung (localStorage)
- `src/components/TypedFolderHeader.vue` — Header-Anpassung
- `src/index.ts` — Setting registrieren
