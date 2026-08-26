<template>
  <div class="pdf-viewer">
    <oc-spinner v-if="loading" :size="32" />
    <div v-else-if="error" class="pdf-viewer-state">
      <oc-icon name="file" fill-type="line" size="large" />
      <p class="pdf-viewer-state-text">{{ error }}</p>
    </div>
    <template v-else>
      <div ref="pagesRef" class="pdf-viewer-pages"></div>
      <p v-if="remainingPages > 0" class="pdf-viewer-more">
        {{ $gettext('… more pages not loaded') }} ({{ remainingPages }})
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { useGettext } from 'vue3-gettext'

// The host app (opencloud_web) ships its own, newer pdfjs (6.x) and exposes
// it as a *global* (`window.pdfjsLib` / `window.pdfjsWorker`). pdfjs'
// fake-worker loader prefers `globalThis.pdfjsWorker` over `workerSrc`, so
// our bundled pdfjs-dist 4.x would pick up the host's 6.x worker and fail
// with "API version does not match the Worker version".
//
// Fix: load *our* worker module and hand its WorkerMessageHandler to pdfjs
// via a dedicated `workerPort`-style global override, so our 4.x API always
// talks to a 4.x worker regardless of what the host registered.
GlobalWorkerOptions.workerSrc = workerUrl

let ourWorkerModule: any = null
let savedGlobalWorker: any = undefined
let globalPatched = false

async function ensureOurWorkerGlobal() {
  if (globalPatched) return
  try {
    // Import our own worker file (same version as the getDocument API).
    ourWorkerModule = await import(/* @vite-ignore */ workerUrl)
    const previous = (globalThis as any).pdfjsWorker
    if (!globalPatched) savedGlobalWorker = previous
    // Point pdfjs' fake-worker loader at our worker, not the host's.
    ;(globalThis as any).pdfjsWorker = ourWorkerModule
    globalPatched = true
    console.debug('[PdfViewer] patched global pdfjsWorker to extension version', ourWorkerModule?.version)
  } catch (workerErr) {
    console.warn('[PdfViewer] could not load our worker module, relying on workerSrc', workerErr)
  }
}

function restoreGlobalWorker() {
  if (!globalPatched) return
  ;(globalThis as any).pdfjsWorker = savedGlobalWorker
  globalPatched = false
}

const props = withDefaults(defineProps<{ content: ArrayBuffer | null; maxPages?: number }>(), {
  content: null,
  maxPages: 50
})

const { $gettext } = useGettext()

const loading = ref(false)
const error = ref('')
const remainingPages = ref(0)
const pagesRef = ref<HTMLElement>()

let renderTask: any = null
let destroyed = false
// Monotonic counter so a newer render invalidates any still-running one
// (e.g. rapid re-selection). Prevents concurrent renders from wiping each
// other's canvases or racing on the shared global worker.
let renderSeq = 0

watch(() => props.content, (buffer) => {
  if (!buffer) {
    renderSeq++
    clearPages()
    return
  }
  void renderPdf(buffer, ++renderSeq)
}, { immediate: true })

onUnmounted(() => {
  destroyed = true
  renderTask?.cancel()
  renderTask = null
  restoreGlobalWorker()
  clearPages()
})

function clearPages() {
  loading.value = false
  error.value = ''
  remainingPages.value = 0
  if (pagesRef.value) pagesRef.value.innerHTML = ''
}

async function renderPdf(data: ArrayBuffer, seq: number) {
  clearPages()
  loading.value = true

  const isStale = () => seq !== renderSeq

  // Make sure pdfjs' fake-worker loader uses OUR worker (matching the 4.x
  // API) and not the host's newer global worker.
  await ensureOurWorkerGlobal()
  if (isStale()) return

  // pdfjs transfers the buffer to the worker, so hand over a copy
  const uint8Data = new Uint8Array(data)
  let doc: any

  try {
    doc = await getDocument({ data: uint8Data }).promise
    console.debug('[PdfViewer] getDocument ok, pages=' + doc.numPages, 'seq=' + seq)
  } catch (loadErr: any) {
    console.error('[PdfViewer] getDocument failed:', loadErr?.name, loadErr?.message, loadErr)
    if (isStale()) return
    if (loadErr?.name === 'PasswordException') {
      error.value = $gettext('Preview not available (password protected?)')
    } else {
      error.value = $gettext('Preview not available')
    }
    loading.value = false
    return
  }

  try {
    const totalPages = doc.numPages
    remainingPages.value = Math.max(0, totalPages - props.maxPages)
    const container = pagesRef.value
    if (!container) return

    for (let pageNumber = 1; pageNumber <= Math.min(totalPages, props.maxPages); pageNumber++) {
      if (isStale()) return
      const page = await doc.getPage(pageNumber)
      if (isStale()) return
      console.debug('[PdfViewer] page ' + pageNumber + ' fetched, rendering…')
      const viewport = page.getViewport({ scale: 1.25 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = '100%'
      canvas.style.display = 'block'
      canvas.style.margin = '0 auto 8px'
      canvas.style.borderRadius = '4px'
      canvas.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)'
      container.appendChild(canvas)

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('2d canvas context unavailable')
      renderTask = page.render({ canvasContext: ctx, viewport })
      try {
        await renderTask.promise
        console.debug('[PdfViewer] rendered page ' + pageNumber)
      } catch (renderErr: any) {
        if (renderErr?.name !== 'RenderingCancelledException') {
          console.error('[PdfViewer] page render failed:', renderErr?.name, renderErr?.message, renderErr)
          if (!isStale()) error.value = $gettext('Preview not available')
          break
        }
      }
      renderTask = null
      page.cleanup()
    }
  } catch (loopErr: any) {
    console.error('[PdfViewer] render loop failed:', loopErr?.name, loopErr?.message, loopErr)
    if (!isStale()) error.value = $gettext('Preview not available')
  } finally {
    if (!destroyed && !isStale()) loading.value = false
    doc.destroy()
    // Give the host back its own global worker so the built-in PDF viewer
    // (pdfjs 6.x) is unaffected once we're done rendering. Only the latest
    // render restores it, so an in-flight newer render keeps our worker.
    if (!isStale()) restoreGlobalWorker()
  }
}
</script>

<style scoped>
.pdf-viewer {
  max-height: 600px;
  overflow: auto;
  padding: 4px;
}
.pdf-viewer-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 8px;
  gap: 8px;
}
.pdf-viewer-state-text {
  margin: 0;
  font-size: 13px;
  color: var(--oc-role-text-secondary, #666);
}
.pdf-viewer-more {
  text-align: center;
  font-size: 12px;
  color: var(--oc-role-text-secondary, #666);
  margin: 4px 0 0;
}
</style>
