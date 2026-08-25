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

GlobalWorkerOptions.workerSrc = workerUrl

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

  try {
    doc = await getDocument({ data: uint8Data }).promise
  } catch (loadErr: any) {
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

      renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport })
      try {
        await renderTask.promise
      } catch (renderErr: any) {
        if (renderErr?.name !== 'RenderingCancelledException') {
          error.value = $gettext('Preview not available')
          break
        }
      }
      renderTask = null
      page.cleanup()
    }
  } finally {
    if (!destroyed) loading.value = false
    doc.destroy()
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
