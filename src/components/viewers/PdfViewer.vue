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

// Fallback: let pdfjs create its own worker from the URL.
GlobalWorkerOptions.workerSrc = workerUrl

// pdfjs' fake-worker fallback fails silently in the Module Federation
// bundle (the fake-worker loader's dynamic import of the .mjs worker does
// not resolve reliably there). We therefore hand pdfjs an explicitly
// created real module worker via `workerPort`, keeping it off the
// fake-worker path entirely. A worker port is single-use, so we create a
// fresh one per render and terminate it when the document is destroyed.
let currentWorker: Worker | null = null

function createWorkerPort(): Worker | undefined {
  try {
    currentWorker = new Worker(workerUrl, { type: 'module' })
    return currentWorker
  } catch (workerErr) {
    console.warn('[PdfViewer] could not create worker, falling back to workerSrc', workerErr)
    currentWorker = null
    return undefined
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

watch(() => props.content, (buffer) => {
  if (!buffer) {
    clearPages()
    return
  }
  renderPdf(buffer)
}, { immediate: true })

onUnmounted(() => {
  destroyed = true
  renderTask?.cancel()
  renderTask = null
  currentWorker?.terminate()
  currentWorker = null
  clearPages()
})

function clearPages() {
  loading.value = false
  error.value = ''
  remainingPages.value = 0
  if (pagesRef.value) pagesRef.value.innerHTML = ''
}

async function renderPdf(data: ArrayBuffer) {
  clearPages()
  loading.value = true

  // pdfjs transfers the buffer to the worker, so hand over a copy
  const uint8Data = new Uint8Array(data)
  let doc: any

  const port = createWorkerPort()
  const init: any = port
    ? { data: uint8Data, workerPort: port }
    : { data: uint8Data }
  try {
    doc = await getDocument(init).promise
    console.debug('[PdfViewer] getDocument ok, pages=' + doc.numPages, 'port=' + !!port)
  } catch (loadErr: any) {
    console.error('[PdfViewer] getDocument failed:', loadErr?.name, loadErr?.message, loadErr)
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
      const page = await doc.getPage(pageNumber)
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
      renderTask = page.render({ canvasContext: ctx, viewport })
      try {
        await renderTask.promise
        console.debug('[PdfViewer] rendered page ' + pageNumber)
      } catch (renderErr: any) {
        if (renderErr?.name !== 'RenderingCancelledException') {
          console.error('[PdfViewer] page render failed:', renderErr?.name, renderErr?.message, renderErr)
          error.value = $gettext('Preview not available')
          break
        }
      }
      renderTask = null
      page.cleanup()
    }
  } catch (loopErr: any) {
    console.error('[PdfViewer] render loop failed:', loopErr?.name, loopErr?.message, loopErr)
    error.value = $gettext('Preview not available')
  } finally {
    if (!destroyed) loading.value = false
    doc.destroy()
    // pdfjs closes the worker port when the document is destroyed; make
    // sure we don't leak it if that path was skipped.
    currentWorker?.terminate()
    currentWorker = null
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
