<template>
  <div class="pdf-viewer">
    <!-- The pages container must stay mounted while rendering: renderPdf
         awaits doc.getPage/render into it, so it can't be behind a
         v-if on `loading` (that would unmount it mid-render and leave
         pagesRef null). -->
    <div v-if="error" class="pdf-viewer-state">
      <oc-icon name="file" fill-type="line" size="large" />
      <p class="pdf-viewer-state-text">{{ error }}</p>
    </div>
    <template v-else>
      <oc-spinner v-if="loading" :size="32" class="pdf-viewer-loading" />
      <div ref="pagesRef" class="pdf-viewer-pages"></div>
      <p v-if="remainingPages > 0" class="pdf-viewer-more">
        {{ $gettext('… more pages not loaded') }} ({{ remainingPages }})
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { getDocument, GlobalWorkerOptions, PDFWorker, TextLayer } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { useGettext } from 'vue3-gettext'

// The host app (opencloud_web) ships its own, newer pdfjs (6.x) and exposes
// it as a *global* (`window.pdfjsLib` / `window.pdfjsWorker`). pdfjs'
// fake-worker loader prefers `globalThis.pdfjsWorker` over `workerSrc`, so
// a plain `getDocument({ data })` would make our bundled pdfjs-dist 4.x pick
// up the host's 6.x worker and fail with "API version does not match the
// Worker version".
//
// Robust fix: give pdfjs an explicitly created *real* worker of OUR version
// via `getDocument({ data, worker })` (pdfjs 4.x reads `src.worker`, a
// PDFWorker instance — NOT `src.workerPort`). A real worker bypasses the
// fake-worker path and the shared global entirely, so our 4.x API always
// talks to a 4.x worker. We keep the global patched as a safety net for any
// code path that still falls back to the fake worker.
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
    console.debug('[PdfViewer] patched global pdfjsWorker to extension version')
  } catch (workerErr) {
    console.warn('[PdfViewer] could not load our worker module, relying on workerSrc', workerErr)
  }
}

function restoreGlobalWorker() {
  if (!globalPatched) return
  ;(globalThis as any).pdfjsWorker = savedGlobalWorker
  globalPatched = false
}

// Create a real worker of our version and wrap it in a PDFWorker so
// getDocument uses it directly (never the fake worker / global).
function createPdfWorker(): PDFWorker | null {
  try {
    const port = new Worker(workerUrl, { type: 'module' })
    return new PDFWorker({ port } as any)
  } catch (workerErr) {
    console.warn('[PdfViewer] could not create real worker, falling back to fake worker', workerErr)
    return null
  }
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

  // Real worker of our version (bypasses fake worker + host global).
  const pdfWorker = createPdfWorker()
  // Safety net for any path that still falls back to the fake worker.
  await ensureOurWorkerGlobal()
  if (isStale()) {
    pdfWorker?.destroy()
    return
  }

  // pdfjs transfers the buffer to the worker, so hand over a copy
  const uint8Data = new Uint8Array(data)
  const init: any = pdfWorker
    ? { data: uint8Data, worker: pdfWorker }
    : { data: uint8Data }
  let doc: any

  try {
    doc = await getDocument(init).promise
    console.debug('[PdfViewer] getDocument ok, pages=' + doc.numPages, 'seq=' + seq, 'realWorker=' + !!pdfWorker)
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

      // Page wrapper: canvas + text-layer overlay (for copy+paste)
      // Note: scoped CSS doesn't apply to imperatively created elements
      // (no data-v-* attribute), so all styles are set inline.
      // Use scale:1 for the text layer viewport so that --scale-factor:1
      // makes setLayerDimensions produce the exact CSS pixel dimensions.
      const pageWrapper = document.createElement('div')
      pageWrapper.style.cssText =
        'position:relative;width:' + viewport.width + 'px;max-width:100%;height:' + viewport.height + 'px;margin:0 auto 8px'

      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.cssText =
        'width:100%;display:block;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.15)'
      pageWrapper.appendChild(canvas)

      // Text layer: invisible overlay for text selection / copy+paste.
      // Only rendered for PDFs with an embedded text layer (not scans).
      const textLayerDiv = document.createElement('div')
      textLayerDiv.style.cssText =
        'position:absolute;inset:0;overflow:hidden;line-height:1;' +
        'text-size-adjust:none;forced-color-adjust:none;' +
        '-webkit-user-select:text;user-select:text;cursor:text;' +
        '--scale-factor:1'
      pageWrapper.appendChild(textLayerDiv)
      container.appendChild(pageWrapper)

      // Render text layer using a scale-1 viewport so that --scale-factor:1
      // yields the correct CSS pixel dimensions (setLayerDimensions uses
      // calc(var(--scale-factor) * pageWidth)). Position is % of page dims,
      // so scale doesn't affect it.
      const textViewport = page.getViewport({ scale: 1 })

      // Use pdfjs TextLayer to render the invisible text overlay.
      // It handles PDF→viewport coordinate conversion, rotation, and fonts.
      const textContent = await page.getTextContent()
      if (textContent.items.length > 0 && !isStale()) {
        try {
          const textLayer = new TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: textViewport
          })
          await textLayer.render()
          // The text layer is rendered at scale:1 (page dims in CSS px) but
          // the canvas is displayed at a different size (max-width:100%).
          // Scale the text layer to match the canvas display size.
          const pageDims = textViewport.width
          const displayWidth = pageWrapper.clientWidth
          if (displayWidth > 0 && pageDims > 0 && Math.abs(displayWidth - pageDims) > 1) {
            const scale = displayWidth / pageDims
            textLayerDiv.style.transformOrigin = '0 0'
            textLayerDiv.style.transform = `scale(${scale.toFixed(4)}, ${scale.toFixed(4)})`
          }
          console.debug('[PdfViewer] text layer page ' + pageNumber + ' ok, items=' + textContent.items.length)
        } catch (tlErr: any) {
          console.debug('[PdfViewer] text layer page ' + pageNumber + ' skipped:', tlErr?.message)
        }
      }

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
    // Terminate the real worker we created for this render.
    pdfWorker?.destroy()
    // Give the host back its own global worker so the built-in PDF viewer
    // (pdfjs 6.x) is unaffected once we're done rendering. Only the latest
    // render restores it, so an in-flight newer render keeps our worker.
    if (!isStale()) restoreGlobalWorker()
  }
}
</script>

<style scoped>
.pdf-viewer {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 4px;
}
.pdf-viewer-page {
  position: relative;
}
.pdf-viewer-text-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  line-height: 1;
  text-size-adjust: none;
  forced-color-adjust: none;
  -webkit-user-select: text;
  user-select: text;
  cursor: text;
  /* TextLayer uses calc(var(--scale-factor) * Npx) for font-size.
     At 1:1 scale the text layer matches the page dimensions exactly. */
  --scale-factor: 1;
}
/* Text layer glyphs: invisible but selectable */
.pdf-viewer-text-layer span {
  color: transparent;
  position: absolute;
  white-space: pre;
  margin: 0;
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

<!-- Non-scoped: TextLayer creates spans imperatively (no data-v-* attr),
     so scoped CSS can't reach them. These rules target the text layer
     container via a unique class we set inline. -->
<style>
.pdf-viewer [style*="--scale-factor"] span {
  color: transparent;
  position: absolute;
  white-space: pre;
  margin: 0;
}
</style>
