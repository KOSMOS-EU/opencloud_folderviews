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
