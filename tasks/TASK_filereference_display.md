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

### Datenquelle: PROPFIND (geloest!)

**Reva-Patch deployed (PR #693, Image 20260619):**
`oy.fileReference` ist jetzt direkt per PROPFIND lesbar:

```xml
<d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
  <d:prop>
    <oc:name/>
    <oc:oy.fileReference/>
  </d:prop>
</d:propfind>
```

Ergebnis (Space "77 Aktenplan" → Innere Verwaltung):
```
11.03    Finanzverwaltung
11.05    Verwaltungssteuerung und -service
11.04    Innere Verwaltungsanglegenheiten
11.01    Einrichtungen fuer die gesamte Verwaltung...
```

Ergebnis (Space "Innere Verwaltung"):
```
11.13    Finanzverwaltung
11.12    Innere Verwaltungsanglegenheiten
11.11    Verwaltungssteuerung und -service
11.16    Einrichtungen fuer die gesamte Verwaltung...
```

**Kein N+1 Problem mehr.** Ein PROPFIND-Call pro Verzeichnis genuegt.

### Reva-Patch Details (4 Stellen in propfind.go + 1 in proppatch.go)

1. `requiresExplicitFetching`: oc: default → `true` (war `false`)
2. `metadataKeyOf`: `n.Local` fuer oc: statt volle URI
3. oc: default in `mdToPropResponse`: ArbitraryMetadata-Lookup statt sofort 404
4. allprop: Custom-Metadata in Response einschliessen
5. `proppatch.go`: gleiche Key-Aenderung fuer Konsistenz

## Anforderungen

### 1. Nutzereinstellung
- [ ] Toggle "Aktenzeichen im Titel anzeigen" (persistent, localStorage)
- [ ] Erreichbar ueber Extension-Settings oder Toolbar-Button
- [ ] Default: aus
- [ ] Einstellung gilt global (alle Typed-Folder-Views)

### 2. PROPFIND-Integration
- [x] `oy.fileReference` per PROPFIND abfragbar (Reva-Patch deployed)
- [ ] Web-Client: `oy.fileReference` als DavProperty registrieren
- [ ] PROPFIND-Request um `<oc:oy.fileReference/>` erweitern
- [ ] fileReference aus PROPFIND-Response parsen und auf Resource-Objekt mappen

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

- `src/composables/useFileReferenceDisplay.ts` — PROPFIND-Property + Zusammenbau
- `src/composables/useExtensionSettings.ts` — Persistente Nutzereinstellung (localStorage)
- `src/components/TypedFolderHeader.vue` — Header-Anpassung
- `src/index.ts` — Setting + DavProperty registrieren
