export type PreviewKind = 'image' | 'text' | 'markdown' | 'pdf' | 'office' | 'mail'

const PREVIEW_EXTENSION_MAP: Record<string, PreviewKind> = {
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  bmp: 'image',
  svg: 'image',
  txt: 'text',
  log: 'text',
  csv: 'text',
  json: 'text',
  xml: 'text',
  md: 'markdown',
  markdown: 'markdown',
  pdf: 'pdf',
  docx: 'office',
  doc: 'office',
  odt: 'office',
  rtf: 'office',
  msg: 'mail',
  eml: 'mail'
}

export function getPreviewKind(fileName: string | undefined): PreviewKind | undefined {
  if (!fileName) return undefined
  const dot = fileName.lastIndexOf('.')
  if (dot === -1) return undefined
  const ext = fileName.substring(dot + 1).toLowerCase()
  return PREVIEW_EXTENSION_MAP[ext]
}

export function isPreviewSupported(fileName: string | undefined): boolean {
  return getPreviewKind(fileName) !== undefined
}
