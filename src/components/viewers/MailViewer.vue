<template>
  <div class="mail-viewer">
    <div v-if="error" class="mail-viewer-state">
      <oc-icon name="file" fill-type="line" size="large" />
      <p class="mail-viewer-state-text">{{ error }}</p>
    </div>
    <iframe
      v-else-if="frameUrl"
      :src="frameUrl"
      class="mail-viewer-frame"
      sandbox="allow-scripts"
    ></iframe>
    <oc-spinner v-else :size="32" class="mail-viewer-loading" />
  </div>
</template>

<script setup lang="ts">
/**
 * .msg / .eml Vorschau.
 *
 * Ursprung (kopiert 2026-08-26, bewusst NICHT shared — die Extensions
 * opencloud_folderviews und opencloud_htmlviewer teilen kein Build-System):
 *   opencloud_htmlviewer/src/modules/mail-viewer.ts  (renderEmail)
 *   opencloud_htmlviewer/src/App.vue                 (sandboxed iframe + Blob-URL)
 * Bei Fixes dort bitte hier spiegeln.
 *
 * Bewusste Abweichung vom Vollviewer: keine Attachment-Toolbar
 * (Sidebar zu schmal) — Anhänge bleiben im htmlviewer-Vollviewer verfügbar.
 */
import { ref, watch, onUnmounted } from 'vue'
import { useGettext } from 'vue3-gettext'
import { parseEml, parseMsg } from '../../composables/mailParser'

const props = withDefaults(defineProps<{ content: ArrayBuffer | null; name?: string }>(), {
  content: null,
  name: ''
})

const { $gettext } = useGettext()

const error = ref('')
const frameUrl = ref('')

let currentBlobUrl: string | null = null
let parseSeq = 0

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderEmailHtml(email: any): string {
  const body = email.bodyHtml || `<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(email.bodyText)}</pre>`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin:0; padding:16px; color:#333; }
  .mail-header { background:#f0f4f9; border-radius:8px; padding:16px; margin-bottom:16px; }
  .mail-field { margin-bottom:4px; font-size:14px; }
  .mail-label { font-weight:600; color:#555; min-width:60px; display:inline-block; }
  .mail-subject { font-size:18px; font-weight:600; margin-bottom:8px; }
  .mail-date { font-size:12px; color:#888; }
  .mail-body { padding:8px 0; line-height:1.5; }
</style></head>
<body>
  <div class="mail-header">
    <div class="mail-subject">${escapeHtml(email.subject)}</div>
    <div class="mail-date">${escapeHtml(email.date)}</div>
    <div class="mail-field"><span class="mail-label">From:</span> ${escapeHtml(email.from)}</div>
    <div class="mail-field"><span class="mail-label">To:</span> ${escapeHtml(email.to)}</div>
    ${email.cc ? `<div class="mail-field"><span class="mail-label">Cc:</span> ${escapeHtml(email.cc)}</div>` : ''}
  </div>
  <div class="mail-body">${body}</div>
</body>
</html>`
}

function setBlobUrl(htmlContent: string) {
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl)
    currentBlobUrl = null
  }
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
  currentBlobUrl = URL.createObjectURL(blob)
  frameUrl.value = currentBlobUrl
}

watch(() => props.content, async (buffer) => {
  if (!buffer) {
    parseSeq++
    frameUrl.value = ''
    return
  }
  const seq = ++parseSeq
  frameUrl.value = ''
  error.value = ''
  console.debug('[MailViewer] parsing', props.name, buffer.byteLength, 'bytes, seq=' + seq)
  try {
    const isMsg = /\.msg$/i.test(props.name)
    const email = isMsg
      ? await parseMsg(buffer)
      : parseEml(new TextDecoder('utf-8').decode(buffer))
    if (seq !== parseSeq) return
    console.debug('[MailViewer] parsed ok', props.name, 'subject=' + (email.subject || '').slice(0, 60))
    setBlobUrl(renderEmailHtml(email))
  } catch (parseErr: any) {
    if (seq !== parseSeq) return
    console.error('[MailViewer] parse failed:', props.name, parseErr?.name, parseErr?.message, parseErr)
    error.value = $gettext('Preview not available')
  }
}, { immediate: true })

onUnmounted(() => {
  parseSeq++
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl)
    currentBlobUrl = null
  }
})
</script>

<style scoped>
.mail-viewer {
  position: relative;
  min-height: 200px;
}
.mail-viewer-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 8px;
  gap: 8px;
}
.mail-viewer-state-text {
  margin: 0;
  font-size: 13px;
  color: var(--oc-role-text-secondary, #666);
}
.mail-viewer-loading {
  display: block;
  margin: 24px auto;
}
.mail-viewer-frame {
  width: 100%;
  height: 500px;
  border: none;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
</style>
