// Editor-/Viewer-Apps am Routennamen erkennen: ein Namensteil (getrennt durch - _ . /) endet auf editor, viewer
// oder craft (text-editor, htmlviewer, pdf-viewer, wordcraft). Die frühere Teilwort-Suche traf auch fremde Wörter:
// "ledger-kreditoren" enthält "editor" und wurde wie ein Editor in ein neues Fenster umgeleitet (2026-11-24).
const APP_NAME_ENDINGS = ['editor', 'viewer', 'craft']

export function isAppRouteName(routeName: string): boolean {
  return routeName
    .toLowerCase()
    .split(/[-_./]/)
    .some((part) => APP_NAME_ENDINGS.some((ending) => part.endsWith(ending)))
}

// Alternativer Weg fürs eigene Fenster (2026-11-25): eine App kann an ihrer Route `meta.directStartUrl(route)`
// anbieten und liefert damit eine eigene Startseite (Craft-Apps: start.html mit nur der App, ohne die ganze
// Oberfläche). Ohne Angabe oder bei `undefined` bleibt es beim Öffnen der Route im neuen Fenster.
type DirectStart = (route: unknown) => string | undefined

export function directStartHref(route: { meta?: Record<string | number | symbol, unknown> }): string | undefined {
  const directStart = route.meta?.directStartUrl
  if (typeof directStart !== 'function') {
    return undefined
  }
  try {
    return (directStart as DirectStart)(route) || undefined
  } catch (error) {
    console.warn('[folderviews] directStartUrl', error)
    return undefined
  }
}
