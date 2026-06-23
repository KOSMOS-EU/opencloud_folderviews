# TASK: Responsive Design für Folderviews Extension

## Analyse

Keine der Folderviews-Komponenten hat responsives Design. Auf Mobile/Tablet sind Listen abgeschnitten, Buttons überlappen, Headers brechen nicht um.

## OpenCloud Responsive-Pattern

OpenCloud nutzt KEINE `@media` Queries in Komponenten. Stattdessen:

### 1. `useIsMobile()` Composable
```typescript
import { useIsMobile } from '@opencloud-eu/design-system/composables'
const { isMobile, isTablet } = useIsMobile()
// isMobile: width < 640px
// isTablet: width <= 960px
```
Bedingte Klassen/Layouts im Template:
```vue
<div :class="{ 'flex': !isMobile, 'flex-col': isMobile }">
```

### 2. Tailwind Responsive Prefixes
```html
<div class="hidden sm:block">        <!-- sichtbar ab 640px -->
<div class="grid-cols-1 md:grid-cols-2">  <!-- 2 Spalten ab 768px -->
```

### 3. CSS Custom Properties
ResourceTiles berechnet `--oc-size-tiles-actual` dynamisch aus Viewport-Breite.
Grid: `grid-template-columns: repeat(auto-fit, minmax(var(--oc-size-tiles-actual), 1fr))`

### 4. Tile-Größe
`useTileSize()` aus `@opencloud-eu/web-pkg`:
- BASE_SIZE = 140px, STEP_SIZE = 84px
- viewSize 1 = 140px, viewSize 2 = 224px, viewSize 6 = 560px

## Betroffene Komponenten

### TypedFolderToolbar.vue (Header)
**Problem**: Icon + Title + Buttons in einer Zeile, bricht nicht um.
**Fix**:
- `useIsMobile()` → bei Mobile: Title kürzen, Buttons unter den Header
- `flex-wrap: wrap` auf die Header-Row
- Buttons: Icon-Only auf Mobile (kein Text)

### ResourceMetro.vue (Kacheln)
**Problem**: Leaf-Tiles haben feste `width: 250px`, passen nicht auf Mobile.
**Fix**:
- Leaf-Tiles: `width: var(--oc-size-tiles-actual, 250px)` statt fester Wert
- Grid: `auto-fill` statt `auto-fit` für besseres Wrapping
- Mobile: volle Breite (1 Spalte)

### ResourceTree.vue (Baumansicht)
**Problem**: Tabelle kann horizontal überlaufen, Indentation nimmt Platz.
**Fix**:
- `overflow-x: auto` auf Container
- Mobile: Indentation reduzieren (10px statt 20px pro Level)
- `useIsMobile()` → bei Mobile: kompaktere Darstellung

### ResourceElements.vue (Element-Ansicht)
**Problem**: Container-Layouts können zu breit werden.
**Fix**:
- `max-width: 100%` auf allen Containern
- `overflow-wrap: break-word` für lange Texte

### ViewTypesTiles.vue (Typ-Kacheln)
**Problem**: `minmax(160px)` ist ok, aber Padding nicht angepasst.
**Fix**:
- Mobile: weniger Padding, kleinere Icons
- Grid-Gap reduzieren auf Mobile

### LearnEditor.vue
**Status**: Teilweise responsive (Task-Spalten 1-spaltig unter 600px).
**Fix**:
- Header responsive machen
- Task-Karten: volle Breite auf Mobile
- Attachment-Buttons: Icon-Only auf Mobile

### CreateDialog.vue
**Problem**: Dialog kann zu breit sein auf Mobile.
**Fix**:
- `max-width: 90vw` auf Mobile
- Farbpalette: weniger Spalten auf Mobile

### FolderSettingsPanel.vue / ViewTypeEditor.vue
**Problem**: Sidebar-Panel und Editor nicht mobilfreundlich.
**Fix**:
- `useIsMobile()` → bei Mobile: volle Breite
- Felder untereinander statt nebeneinander

### MdmEditor.vue (extern, openmdm)
**Problem**: Tabs + Listen nicht responsive.
**Fix**:
- Tabs: horizontal scrollbar auf Mobile
- Listen: kompaktere Items
- Action-Buttons: Wrapping

## Implementierung

### Schritt 1: Shared Responsive Setup
```typescript
// In jeder Komponente:
import { useIsMobile } from '@opencloud-eu/design-system/composables'
const { isMobile, isTablet } = useIsMobile()
```

### Schritt 2: TypedFolderToolbar (Header)
- `flex-wrap: wrap` auf Header-Row
- Mobile: Buttons in eigene Zeile
- Icon: `size="large"` statt `size="xxlarge"` auf Mobile

### Schritt 3: ResourceMetro (Tiles)
- Leaf-Tiles: CSS Variable statt fester Breite
- `aspect-ratio` beibehalten
- Grid responsive via `auto-fill`

### Schritt 4: ResourceTree (Baum)
- `overflow-x: auto` auf `.resource-tree`
- Indentation: `depthMap.get(resource.id) * (isMobile ? 10 : 20)`

### Schritt 5: Dialoge + Panels
- `max-width: min(90vw, 500px)` für Dialoge
- Panel: `width: 100%` auf Mobile

### Schritt 6: MdmEditor (extern)
- Tabs: `overflow-x: auto` + `white-space: nowrap`
- Action-Cards: `flex-wrap: wrap`

## Testkriterien
- [ ] Chrome DevTools: 375px (iPhone SE), 768px (iPad), 1024px (Desktop)
- [ ] Kein horizontaler Overflow auf keiner Komponente
- [ ] Alle Buttons erreichbar auf Mobile
- [ ] Tiles füllen die verfügbare Breite sinnvoll
- [ ] Tree-View scrollbar ohne Layout-Bruch
- [ ] Dialoge nicht breiter als Viewport
