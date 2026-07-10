# App Compact Mode & Desktop-Verknüpfungen

## App Compact Mode

Externe Apps (Collabora, OnlyOffice etc.) können im Kompaktmodus geöffnet werden.
Im Kompaktmodus wird die gesamte OpenCloud-UI ausgeblendet — kein TopBar, kein
Dokumenten-Header, kein Container-Rahmen. Nur der iframe der Anwendung.

### Aktivierung

Query-Parameter `?appCompact=true` an die App-URL anhängen:

```
https://cloud.example.com/external-collaboraonline/personal/admin/Dokument.odt?fileId=<id>&appCompact=true
```

### User-Settings (Folderviews Extension)

Unter Benutzermenü → Einstellungen → Erweiterungen:

- **Apps kompakt öffnen** — hängt automatisch `?appCompact=true` an alle externen App-Routes
- **Datei in neuem Fenster öffnen** — öffnet externe Apps in einem separaten Browserfenster

### Pin-Aktion

Rechtsklick auf eine Datei → **Pin** erzeugt eine Desktop-Verknüpfung:

- **Windows**: `.url`-Datei (Internet Shortcut)
- **Linux**: `.desktop`-Datei (erfordert ggf. chmod +x)
- **macOS**: `.webloc`-Datei

Die Verknüpfung zeigt auf die Datei im Compact-Modus.

## Einschränkungen

### Kein direkter App-Start über .url-Dateien

Ein `.url`-Shortcut öffnet die URL immer im **Standard-Browser**. Die App läuft
dann im normalen Browserfenster (mit Adressleiste).

Um ein Dokument direkt als eigenständige App (ohne Adressleiste) zu öffnen, muss
der Browser mit dem `--app`-Flag gestartet werden:

```bash
# Chrome / Chromium
google-chrome --app="https://cloud.example.com/external-collaboraonline/personal/admin/Dokument.odt?fileId=<id>&appCompact=true"

# Brave
brave-browser --app="https://cloud.example.com/..."

# Edge
msedge --app="https://cloud.example.com/..."
```

Das `--app`-Flag öffnet die URL in einem chromeless Fenster (kein Tab-Bar, keine
Adressleiste, keine Menüleiste). Dies kann **nicht** über `.url`-Dateien abgebildet
werden, da `.url`-Dateien keinen Browser-Parameter übergeben können.

### Workaround für Desktop-Shortcuts mit --app

**Windows** — `.bat`-Datei oder Verknüpfung mit Ziel:
```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --app="https://cloud.example.com/..."
```

**Linux** — `.desktop`-Datei mit Exec:
```ini
[Desktop Entry]
Type=Application
Name=Dokument.odt
Exec=google-chrome --app="https://cloud.example.com/...&appCompact=true"
Icon=text-x-generic
```

**macOS** — Shell-Script oder Automator-Aktion:
```bash
open -a "Google Chrome" --args --app="https://cloud.example.com/..."
```

### PWA

Wenn OpenCloud als PWA installiert ist (`manifest.json` mit `display: standalone`),
öffnet sich die gesamte App ohne Browser-Chrome. Allerdings gilt das für die
**komplette** Anwendung (inkl. Dateiliste), nicht nur für einzelne Dokumente.
Separate Dokumentfenster über `window.open()` öffnen sich trotzdem im Browser.

## Implementierung

| Datei | Paket | Beschreibung |
|---|---|---|
| `piniaStores/appCompact.ts` | web-pkg | Pinia Store, latcht `?appCompact=true` aus URL |
| `layouts/Application.vue` | web-runtime | Blendet TopBar + Container-Rahmen aus |
| `AppTemplates/AppWrapper.vue` | web-pkg | Unterdrückt AppTopBar-Extension |
| `useFolderviewSettings.ts` | folderviews | User-Settings für compact + neues Fenster |
| `index.ts` (router guard) | folderviews | Fügt `?appCompact=true` in externe Routes ein |
| `index.ts` (Pin action) | folderviews | Erzeugt Desktop-Verknüpfung |
