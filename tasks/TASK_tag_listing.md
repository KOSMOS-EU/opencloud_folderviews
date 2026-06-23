# TASK: Tag Listing View

## Übersicht

Neuer FolderView-Modus "Tag-Suche" — ähnlich Tree/Condensed, aber:
- Sucht nach Text und/oder Tags in allen Verzeichnissen + Dokumenten
- Verzeichnis-Treffer: erste Ebene automatisch aufgeklappt
- Tags als Chips in jeder Zeile angezeigt
- Zwei konfigurierbare Metadata-Spalten

## Datenquellen

### Tags
- Gespeichert als `oy.tags` (ArbitraryMetadata, kommasepariert)
- Per PROPFIND als extraProp: `oc:oy.tags`
- Bereits registriert in `index.ts` (muss ergänzt werden)
- Setzen: über Sidebar-Panel oder Kontextmenü-Action

### Metadata-Spalten
- Kommen aus dem `.viewtype` Schema (`metadata` Block)
- Schema definiert verfügbare Felder pro Space (z.B. oy.fileReference, oy.status)
- Nutzer wählt 2 Felder aus den verfügbaren als Spalten
- Auswahl wird als User-Preference gespeichert (Extension Preferences API)
- Default: `oy.fileReference` + `oy.note` (wenn im Schema vorhanden)

### Suche
- **Textsuche**: Filtert Name + Tags + Metadata-Werte (client-seitig)
- **Tag-Filter**: Klick auf Tag → nur Resources mit diesem Tag anzeigen
- **Kombination**: Text UND Tag-Filter gleichzeitig möglich
- Scope: aktueller Ordner + Unterordner (rekursiv per WebDAV PROPFIND Depth: infinity)

## Komponente: ResourceTagList.vue

### Layout
```
┌──────────────────────────────────────────────────────┐
│ [🔍 Suchtext...]  [Tag1] [Tag2] [Tag3]  [⚙ Spalten] │
├──────────────────────────────────────────────────────┤
│ ☐  📁 Projektordner    [dringend] [review]  11.03  Entwurf │
│     ☐  📄 Vertrag.pdf  [review]             11.03.01       │
│     ☐  📄 Anlage.docx  [dringend]           11.03.02       │
│ ☐  📄 Notiz.md         [todo]               12.01  Hinweis │
│ ☐  📁 Archiv           [archiv]             13.00          │
│     ☐  📄 Alt.pdf      [archiv]             13.00.01       │
└──────────────────────────────────────────────────────┘
 Name                      Tags              Spalte1  Spalte2
```

### Toolbar
- **Suchfeld**: Text-Input, filtert live beim Tippen (debounced 300ms)
- **Tag-Chips**: Alle verwendeten Tags als klickbare Chips
  - Klick: aktiviert/deaktiviert Tag-Filter
  - Aktive Tags: farbig hervorgehoben
  - Zähler: Anzahl Resources mit diesem Tag
- **Spalten-Button**: Dropdown mit verfügbaren Metadata-Feldern (aus Schema)
  - Max. 2 auswählbar
  - Auswahl persistent (User Preferences)

### Ergebnis-Tabelle
- Basis: `<resource-table>` (wie Tree-View, condensed)
- Spalten:
  1. **Checkbox** (Selektion für Batch-Actions)
  2. **Icon + Name** (mit Indentation für Unterordner)
  3. **Tags** (farbige Chips, klickbar → Filter)
  4. **Metadata Spalte 1** (konfigurierbar)
  5. **Metadata Spalte 2** (konfigurierbar)
- Verzeichnis-Treffer: automatisch aufgeklappt (erste Ebene)
- Sortierung: nach Name (default), klickbar auf Spaltenköpfe

### Tag-Management
- **Tag setzen**: Kontextmenü-Action "Tags bearbeiten" → Inline-Editor
  - Kommaseparierte Eingabe
  - Autocomplete aus existierenden Tags
  - Speichert als `oy.tags` Metadata via Graph API
- **Tag-Farben**: Aus einer festen Palette (hash-basiert auf Tag-Name)
- **Bulk-Tagging**: Mehrere Resources selektieren → Tag auf alle setzen

## Registration

### FolderView Extension
```typescript
{
  id: 'com.kosmos-eu.folderviews.folder-view.resource-tag-list',
  type: 'folderView',
  extensionPointIds: [
    'app.files.folder-views.folder',
    'app.files.folder-views.project-spaces'
  ],
  folderView: {
    name: 'resource-tag-list',
    label: $gettext('Tag search'),
    icon: { name: 'price-tag-3', fillType: 'line' },
    component: markRaw(ResourceTagList)
  }
}
```

### Extra Props
```typescript
clientService.webdav.registerExtraProp('oc:oy.tags')
```

### Kontextmenü-Action
```typescript
{
  name: 'edit-tags',
  icon: 'price-tag-3',
  label: () => $gettext('Tags bearbeiten'),
  handler: openTagEditor
}
```

## Implementierung

### Phase 1: Grundgerüst
- [ ] ResourceTagList.vue Komponente
- [ ] Registration als FolderView
- [ ] `oy.tags` extraProp registrieren
- [ ] Basis-Tabelle mit Name + Tags Spalte
- [ ] Tag-Chips rendern (farbig, hash-basiert)

### Phase 2: Suche + Filter
- [ ] Suchfeld mit Debounce
- [ ] Tag-Filter (Klick auf Chip → Filter)
- [ ] Kombination Text + Tag
- [ ] Rekursive Suche (PROPFIND Depth: infinity oder WebDAV search)

### Phase 3: Metadata-Spalten
- [ ] Schema laden → verfügbare Felder ermitteln
- [ ] Spalten-Picker (Dropdown, max 2)
- [ ] User Preference speichern/laden
- [ ] Metadata-Werte in Spalten anzeigen

### Phase 4: Tag-Management
- [ ] Kontextmenü "Tags bearbeiten"
- [ ] Inline Tag-Editor (Kommasepariert + Autocomplete)
- [ ] Tags speichern via Metadata API
- [ ] Bulk-Tagging (Multi-Select + Tag setzen)

### Phase 5: Verzeichnis-Aufklappung
- [ ] Treffer-Verzeichnisse automatisch aufklappen
- [ ] Lazy-Loading für Unterordner (wie Tree-View)
- [ ] Indentation wie Tree-View

## Offene Fragen

- **PROPFIND Depth: infinity** — performant genug für große Spaces?
  Alternative: OpenCloud Search API nutzen (wenn Metadata indexed, PR #2987/#2988)
- **Tag-Speicherort**: `oy.tags` als einzelnes Feld (kommasepariert) oder
  als OpenCloud native Tags (`oc:tags`)? Native Tags haben Server-Support
  (Tagging-Service), aber weniger flexibel.
- **Responsive**: Tag-Chips umbrechen auf Mobile, Metadata-Spalten ausblenden
