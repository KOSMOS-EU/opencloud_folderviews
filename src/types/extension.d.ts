// @kenjiuno/msgreader hat keine TS-Typen; hier der minimale, für
// parseMsg (src/composables/mailParser.ts) benötigte Schnitt.
declare module '@kenjiuno/msgreader' {
  interface MsgReaderAttachment {
    fileName?: string
    name?: string
    mimeType?: string
  }

  interface MsgReaderRecipient {
    recipType?: string
    name?: string
    email?: string
  }

  interface MsgReaderData {
    senderName?: string
    senderEmail?: string
    recipients?: MsgReaderRecipient[]
    subject?: string
    messageDeliveryTime?: string
    clientSubmitTime?: string
    body?: string
    bodyHtml?: string
    attachments?: MsgReaderAttachment[]
  }

  class MsgReader {
    constructor(buffer: ArrayBuffer | Uint8Array)
    getFileData(): MsgReaderData
    getAttachment(index: number): { content?: number[] | Uint8Array } | null
  }

  export default MsgReader
}
