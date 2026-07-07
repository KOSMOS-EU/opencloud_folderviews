# Plan: App Mode — Nächste Schritte (sauber)

## Aktueller Stand (working-appmode Tag)
- ✅ Server-Endpoint: `GET /graph/v1beta1/extensions/apps`
- ✅ FolderViews registriert Space-Apps als `appMenuItem` im 3x3-Menü
- ✅ `useAppMode` Composable in web-pkg mit Latch (bleibt an nach ?appMode=true)
- ✅ Sidebar (links) wird ausgeblendet im appMode
- ✅ Suchleiste wird durch Extension Point `appMode.primaryNav` ersetzt
- ✅ Sidebar-Toggle ausgeblendet im appMode
- ✅ Rechte Details-Sidebar immer geschlossen im appMode

## Offene Probleme

### 1. AppModeBar Menü verschwindet bei Navigation
**Ursache**: Die AppModeBar ist eine Extension-Komponente die beim Route-Wechsel
re-mountet wird. Dabei geht der lokale State (appConfig, activeIndex) verloren.
`window.__spaceApps` hat die Daten, aber der Space-Match findet nicht rechtzeitig statt.

**Lösung**:
- `useAppMode` in web-pkg um `appConfig` ref erweitern (module-level, überlebt Remounts)
- FolderViews setzt `useAppMode().setConfig(app)` beim App-Start
- AppModeBar liest `useAppMode().config` statt lokal zu matchen
- Problem: FolderViews kann `useAppMode` nicht direkt importieren (MF shared module)
- **Lösung dafür**: `useAppMode` muss als shared module in der extension-sdk konfiguriert sein,
  ODER: die Config wird über einen Pinia Store geteilt (Pinia ist shared)
- **Beste Lösung**: Eigener Pinia Store `useAppModeStore` in web-pkg — Pinia Stores sind
  automatisch zwischen Host und MF-Remotes geteilt (gleiche Pinia-Instanz)

### 2. View-Options/Settings im Header ausblenden
**Ursache**: `displayFullAppBar` in GenericSpace.vue steuert View-Options.
Aktuell kein appMode-Check.

**Lösung**:
- GenericSpace.vue: `displayFullAppBar` = false wenn `useAppModeStore().isEnabled`
- Das ist Web-Runtime Code (kosmos Branch), kein Extension-Code

### 3. Typed Folder Header ausblenden
**Ursache**: TypedFolderToolbar zeigt im appMode seinen eigenen Header mit Icons/Buttons.

**Lösung**:
- TypedFolderToolbar: `v-if="isTyped && !appModeStore.isEnabled"`
- Zugriff über `useAppModeStore()` (Pinia, shared)

### 4. Metro View als Default im App Mode
**Lösung**: Der Handler in FolderViews setzt `view-mode: 'resource-metro'` als Query beim Start.
Bereits im Code, muss nur funktionieren.

### 5. App Mode verlassen bei Space-Wechsel
**Lösung**: `useAppModeStore` watched die Route und disablet wenn Space-Alias wechselt.
Bereits im Latch implementiert.

### 6. Menü-Items im 3x3-Menü sollen eigene Default-Views haben
Z.B. "Dateien" → Table-View, nicht Metro. Das ist ein späteres Feature
(view-mode pro App-Menüpunkt in der config.json).

## Implementierungsplan

### Schritt 1: Pinia Store `useAppModeStore` (web-pkg)
```ts
// web-pkg/src/composables/piniaStores/appMode.ts
export const useAppModeStore = defineStore('appMode', () => {
  const enabled = ref(false)
  const config = ref<AppConfig | null>(null)
  const spaceAlias = ref('')

  // Latch + auto-disable bei Space-Wechsel
  // ...

  return { enabled, config, spaceAlias, enable, disable, setConfig }
})
```

**Warum Pinia**: Pinia Stores sind singleton und werden zwischen Host und MF-Remotes
geteilt (gleiche Pinia-Instanz). Kein `window.__` Hack, kein sessionStorage.

### Schritt 2: Web-Runtime Integration
- Application.vue: `isSidebarVisible` prüft `appModeStore.enabled`
- TopBar.vue: Center-Slot wechselt zwischen Search und AppMode-Nav
- GenericSpace.vue: `displayFullAppBar` prüft `appModeStore.enabled`

### Schritt 3: FolderViews Integration
- index.ts: Handler setzt `appModeStore.setConfig(app)` + `appModeStore.enable()`
- AppModeBar: liest `appModeStore.config` — kein lokaler State, kein Window-Hack
- TypedFolderToolbar: prüft `appModeStore.enabled`

### Schritt 4: AppModeBar Styling
- Horizontales Primärmenü im TopBar-Center
- Sekundärmenü als zweite Zeile (nur bei children)
- Kein App-Titel (steht schon im 3x3-Menü)
- ✕-Button zum Verlassen
