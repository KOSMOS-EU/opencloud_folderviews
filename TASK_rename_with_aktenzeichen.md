# Task: Rename-Dialog mit Aktenzeichen-Feld

## Problem

Der Rename-Dialog in OpenCloud hat eine einzelne Eingabezeile für den Dateinamen.
Wenn `showAktzInName` aktiv ist, ist der Name bereits mit Aktenzeichen präfixiert
(`"11.16.05.01 Originalname"`). Der User muss das Aktenzeichen im Namensfeld
manuell bearbeiten — fehleranfällig und unintuitiv.

## Ziel

Rename-Dialog aufteilen in zwei Felder:
1. **Dateiname** — der eigentliche Name (ohne Aktenzeichen-Prefix)
2. **Aktenzeichen** — das `oy.fileReference` Metadatum

Das Aktenzeichen-Feld:
- Nur sichtbar wenn `showAktzInName` aktiv und Resource eine fileReference hat
- Validiert gegen Parent-Aktenzeichen (Prefix-Sicherheit)
- Schreibt `oy.fileReference` als Metadatum zurück

## Aktenzeichen-Validierung

Das Aktenzeichen des Kindes muss ein Sub-Zeichen des Parents sein:
- Parent: `11.16.05`
- Erlaubt: `11.16.05.01`, `11.16.05.02-03`
- Nicht erlaubt: `11.17.01`, `12.01`, leer

Prüfung: `newAktz.startsWith(parentAktz)` — einfache Prefix-Validierung.

## Architektur

### 1. Custom Rename Modal Component

Neue Vue-Komponente `RenameWithAktzModal.vue` in folderviews:

```vue
<template>
  <div>
    <label>Dateiname</label>
    <input v-model="fileName" />

    <label v-if="hasAktz">Aktenzeichen</label>
    <input v-if="hasAktz" v-model="aktz" />
    <span v-if="aktzError" class="error">{{ aktzError }}</span>
  </div>
</template>
```

### 2. Override Rename Action in folderviews

In `index.ts`: eigene Rename-Action registrieren die das Custom Modal nutzt.
Upstream `dispatchModal` mit `customComponent` statt `hasInput`.

```typescript
dispatchModal({
  title: 'Umbenennen',
  customComponent: RenameWithAktzModal,
  customComponentAttrs: () => ({
    resource,
    parentAktz: getFileReference(parentFolder),
    showAktz: showAktzInName.value
  }),
  onConfirm: async ({ fileName, aktz }) => {
    // 1. Rename file (WebDAV MOVE)
    // 2. Set oy.fileReference metadata (if changed)
  }
})
```

### 3. Metadaten-Schreibung

Aktenzeichen wird als `oy.fileReference` xattr geschrieben via:
```
PROPPATCH /dav/spaces/{driveId}/{path}
<set><prop><om:oy.fileReference>11.16.05.01</om:oy.fileReference></prop></set>
```

Oder via Graph API metadata endpoint:
```
PUT /graph/v1beta1/drives/{driveId}/items/{itemId}/metadata
{ "oy.fileReference": "11.16.05.01" }
```

## Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/RenameWithAktzModal.vue` | Neue Komponente: zwei Felder + Validierung |
| `src/index.ts` | Rename-Action überschreiben mit Custom Modal |
| `src/composables/useFileReference.ts` | `validateAktz(newAktz, parentAktz)` Hilfsfunktion |
| `l10n/translations.json` | Labels für die neuen Felder |

## Upstream-Abhängigkeiten

- `dispatchModal({ customComponent })` — existiert bereits in web-pkg (modals.ts:46)
- `CustomModalComponentEmits` — confirm/cancel Pattern existiert
- Kein Upstream-Code-Änderung nötig

## Offene Fragen

- Soll der Rename-Override nur im Folderviews-Kontext greifen oder global?
  → Nur wenn `showAktzInName` aktiv (sonst normaler Rename)
- Was passiert beim Rename eines Ordners mit Kindern — Aktenzeichen der Kinder anpassen?
  → Erstmal nein, nur das eigene Aktenzeichen. Kaskade ist Folge-Task.
