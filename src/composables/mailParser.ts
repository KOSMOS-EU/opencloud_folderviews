/**
 * Client-seitiges Parsen von .eml (RFC 2822 / MIME) und .msg (Outlook OLE).
 *
 * Ursprung (kopiert 2026-08-26, bewusst NICHT shared — die Extensions
 * opencloud_folderviews und opencloud_htmlviewer teilen kein Build-System):
 *   opencloud_htmlviewer/src/modules/eml-parser.ts  (parseEml)
 *   opencloud_htmlviewer/src/modules/mail-viewer.ts (parseMsgToEmail)
 * Bei Fixes dort bitte hier spiegeln.
 */

export interface EmailAttachment {
  filename: string
  mimeType: string
  content: Uint8Array
}

export interface ParsedEmail {
  from: string
  to: string
  cc: string
  subject: string
  date: string
  headers: Record<string, string>
  bodyText: string
  bodyHtml: string
  attachments: EmailAttachment[]
}

function decodeQuotedPrintable(input: string, charset = 'utf-8'): string {
  const bytes: number[] = []
  const lines = input.replace(/=\r?\n/g, '') // soft line breaks
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '=' && i + 2 < lines.length) {
      const hex = lines.substring(i + 1, i + 3)
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16))
        i += 2
        continue
      }
    }
    bytes.push(lines.charCodeAt(i))
  }
  return new TextDecoder(charset).decode(new Uint8Array(bytes))
}

function decodeBase64ToBytes(input: string): Uint8Array {
  const cleaned = input.replace(/[\r\n\s]/g, '')
  const binary = atob(cleaned)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function decodeBase64(input: string, charset = 'utf-8'): string {
  return new TextDecoder(charset).decode(decodeBase64ToBytes(input))
}

function decodeRfc2047(input: string): string {
  // =?charset?encoding?text?=
  return input.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, charset, enc, text) => {
    if (enc.toUpperCase() === 'B') {
      return decodeBase64(text, charset)
    }
    // Q encoding: like quoted-printable but _ = space
    return decodeQuotedPrintable(text.replace(/_/g, ' '), charset)
  })
}

function parseHeaders(raw: string): Record<string, string> {
  const headers: Record<string, string> = {}
  // Unfold continuation lines (lines starting with whitespace)
  const unfolded = raw.replace(/\r?\n([ \t])/g, ' ')
  for (const line of unfolded.split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx > 0) {
      const key = line.substring(0, idx).trim().toLowerCase()
      const val = decodeRfc2047(line.substring(idx + 1).trim())
      headers[key] = val
    }
  }
  return headers
}

function getCharset(contentType: string): string {
  const match = contentType.match(/charset="?([^";]+)"?/i)
  return match ? match[1].trim() : 'utf-8'
}

function getFilename(headers: Record<string, string>): string {
  const cd = headers['content-disposition'] || ''
  const ct = headers['content-type'] || ''
  for (const source of [cd, ct]) {
    const match = source.match(/(?:file)?name\*?="?([^";]+)"?/i)
    if (match) return decodeRfc2047(match[1].trim())
  }
  return ''
}

function decodePart(body: string, encoding: string, charset: string): string {
  switch (encoding.toLowerCase()) {
    case 'base64':
      return decodeBase64(body, charset)
    case 'quoted-printable':
      return decodeQuotedPrintable(body, charset)
    default:
      return body
  }
}

function decodePartToBytes(body: string, encoding: string): Uint8Array {
  switch (encoding.toLowerCase()) {
    case 'base64':
      return decodeBase64ToBytes(body)
    default: {
      const enc = new TextEncoder()
      return enc.encode(body)
    }
  }
}

interface MimePart {
  headers: Record<string, string>
  body: string
}

function parseMimeParts(body: string, boundary: string): MimePart[] {
  const parts: MimePart[] = []
  const delimiter = '--' + boundary
  const segments = body.split(delimiter)

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i]
    if (segment.startsWith('--')) break // closing delimiter

    const divider = segment.indexOf('\r\n\r\n') !== -1
      ? segment.indexOf('\r\n\r\n')
      : segment.indexOf('\n\n')
    const headerLen = divider !== -1 ? (segment.indexOf('\r\n\r\n') !== -1 ? 4 : 2) : 0

    if (divider === -1) continue

    const headerBlock = segment.substring(0, divider).replace(/^\r?\n/, '')
    const partBody = segment.substring(divider + headerLen).replace(/\r?\n$/, '')

    parts.push({
      headers: parseHeaders(headerBlock),
      body: partBody
    })
  }
  return parts
}

function processPart(part: MimePart, email: ParsedEmail) {
  const ct = part.headers['content-type'] || 'text/plain'
  const encoding = part.headers['content-transfer-encoding'] || '7bit'
  const charset = getCharset(ct)
  const disposition = part.headers['content-disposition'] || ''

  // Nested multipart
  const boundaryMatch = ct.match(/boundary="?([^";]+)"?/i)
  if (boundaryMatch) {
    const subParts = parseMimeParts(part.body, boundaryMatch[1])
    for (const sub of subParts) {
      processPart(sub, email)
    }
    return
  }

  // Attachment
  const filename = getFilename(part.headers)
  if (disposition.toLowerCase().startsWith('attachment') || (filename && !ct.startsWith('text/'))) {
    email.attachments.push({
      filename: filename || 'attachment',
      mimeType: ct.split(';')[0].trim(),
      content: decodePartToBytes(part.body, encoding)
    })
    return
  }

  // Inline text
  if (ct.startsWith('text/html')) {
    email.bodyHtml = decodePart(part.body, encoding, charset)
  } else if (ct.startsWith('text/plain') && !email.bodyText) {
    email.bodyText = decodePart(part.body, encoding, charset)
  }
}

export function parseEml(raw: string): ParsedEmail {
  // Split headers from body
  const divider = raw.indexOf('\r\n\r\n') !== -1
    ? raw.indexOf('\r\n\r\n')
    : raw.indexOf('\n\n')
  const headerLen = raw.indexOf('\r\n\r\n') !== -1 ? 4 : 2

  const headerBlock = divider !== -1 ? raw.substring(0, divider) : raw
  const body = divider !== -1 ? raw.substring(divider + headerLen) : ''

  const headers = parseHeaders(headerBlock)

  const email: ParsedEmail = {
    from: headers['from'] || '',
    to: headers['to'] || '',
    cc: headers['cc'] || '',
    subject: headers['subject'] || '',
    date: headers['date'] || '',
    headers,
    bodyText: '',
    bodyHtml: '',
    attachments: []
  }

  const contentType = headers['content-type'] || 'text/plain'
  const encoding = headers['content-transfer-encoding'] || '7bit'
  const charset = getCharset(contentType)

  // Multipart
  const boundaryMatch = contentType.match(/boundary="?([^";]+)"?/i)
  if (boundaryMatch) {
    const parts = parseMimeParts(body, boundaryMatch[1])
    for (const part of parts) {
      processPart(part, email)
    }
  } else if (contentType.startsWith('text/html')) {
    email.bodyHtml = decodePart(body, encoding, charset)
  } else {
    email.bodyText = decodePart(body, encoding, charset)
  }

  return email
}

export async function parseMsg(buffer: ArrayBuffer): Promise<ParsedEmail> {
  // Polyfill Buffer für msgreader (Node.js-Abhängigkeit), wie im htmlviewer
  if (!(globalThis as any).Buffer) {
    const { Buffer } = await import('buffer')
    ;(globalThis as any).Buffer = Buffer
  }
  const mod = await import('@kenjiuno/msgreader')
  const MsgReader = (mod as any).default?.default || (mod as any).default || mod
  const reader = new MsgReader(buffer)
  const msg = reader.getFileData()

  const attachments: EmailAttachment[] = (msg.attachments || []).map((att: any, idx: number) => {
    const attData = reader.getAttachment(idx)
    return {
      filename: att.fileName || att.name || `attachment_${idx}`,
      mimeType: att.mimeType || 'application/octet-stream',
      content: attData?.content ? new Uint8Array(attData.content) : new Uint8Array(0)
    }
  })

  return {
    from: msg.senderName && msg.senderEmail
      ? `${msg.senderName} <${msg.senderEmail}>`
      : msg.senderEmail || msg.senderName || '',
    to: (msg.recipients || [])
      .filter((r: any) => r.recipType === 'to' || !r.recipType)
      .map((r: any) => r.name || r.email || '')
      .join(', '),
    cc: (msg.recipients || [])
      .filter((r: any) => r.recipType === 'cc')
      .map((r: any) => r.name || r.email || '')
      .join(', '),
    subject: msg.subject || '',
    date: msg.messageDeliveryTime || msg.clientSubmitTime || '',
    headers: {},
    bodyText: msg.body || '',
    bodyHtml: msg.bodyHtml || '',
    attachments
  }
}
