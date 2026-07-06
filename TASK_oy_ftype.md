# Task: oy.type → oy.ftype Refactoring

## Ziel
Ordnertypen als Metadatum (`oc:oy.ftype`) direkt am Ordner speichern statt nur über `_type_*` Dateien innerhalb des Ordners. Ermöglicht Typ-Erkennung im Listing ohne Unterordner zu scannen.

## Aktueller Stand
- Ordnertyp wird über `_type_<typ>` Datei IM Ordner gespeichert
- Leaf-Erkennung über `oc:oy.app` xattr (wird bei Leaf-Ordnern gesetzt)
- Typ des Ordners ist im Listing des Elternordners NICHT sichtbar
- `leafStrict` kann nicht funktionieren weil Kind-Typen nicht erkennbar

## Neues Verhalten

### xattr `oc:oy.ftype`
- Wird beim Erstellen eines typed Ordners als xattr gesetzt (z.B. `oy.ftype = "thema"`)
- Wird als `registerExtraProp('oc:oy.ftype')` registriert → im PROPFIND-Listing sichtbar
- Ersetzt `oc:oy.app` für Leaf-Erkennung (stattdessen: `schema[ftype].isLeaf`)

### Betroffene Stellen

#### 1. `createTypedChild` (useTypedFolderActions.ts)
- Beim Erstellen: `oy.ftype` xattr auf den neuen Ordner setzen (PROPPATCH)
- `_type_*` Datei weiterhin erstellen (Rückwärtskompatibilität)

#### 2. `registerExtraProp` (index.ts)
- `oc:oy.ftype` registrieren (neben oy.fileReference, oy.color, oy.note, oy.app)

#### 3. TypedFolderToolbar.vue — leafStrict Logik
- Kind-Ordner haben jetzt `extraProps['oc:oy.ftype']`
- Schema-Lookup: `getCachedSchema(spaceId, childFtype)?.isLeaf`
- Wenn ein Kind mit isLeaf-Typ existiert → non-leaf Buttons ausblenden

#### 4. Typ-Erkennung (useTypedFolderSchema.ts / Metro/Tree/Elements Views)
- Aktuell: `resources.find(r => r.name?.startsWith('_type_'))` → Typ aus Dateiname
- Neu: Erst `extraProps['oc:oy.ftype']` prüfen, Fallback auf `_type_*` Datei
- Caching: Schema-Lookup über `ftype` statt `_type_` Datei-Scan

#### 5. oy.app entfernen
- `oc:oy.app` war ein Workaround für Leaf-Erkennung
- Ersetzen durch: `schema[oy.ftype].app` (aus gecachtem Schema)
- `registerExtraProp('oc:oy.app')` entfernen (oder deprecaten)

### Migration bestehender Ordner
- Script oder On-Read-Migration: wenn `_type_*` Datei vorhanden aber kein `oy.ftype` xattr → setzen
- Oder: Fallback in der Erkennung beibehalten (`_type_*` als Fallback)

## Vorteile
- Typ im Listing sofort sichtbar (kein Unterordner-Scan)
- leafStrict funktioniert (Kind-Typen erkennbar im Eltern-Listing)
- Sauberer Lookup: `schema[ftype]` statt `_type_` Datei parsen + oy.app
- App-Zuordnung über Schema statt extra xattr
