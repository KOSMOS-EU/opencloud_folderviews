<template>
  <div class="p-4 preview-panel">
    <div v-if="!supported" class="preview-panel-state">
      <oc-icon name="file" fill-type="line" size="large" />
      <p class="preview-panel-state-text">{{ $gettext('No preview available') }}</p>
    </div>
    <template v-else>
      <oc-spinner v-if="loading" :size="32" />
      <p v-else-if="error" class="preview-panel-state-text">{{ $gettext('No preview available') }}</p>
      <TextViewer v-else-if="kind === 'text'" :content="textContent" />
      <img v-else-if="kind === 'image'" class="preview-panel-image" :src="(binaryContent as string)" :alt="resource?.name" />
      <MarkdownPreviewViewer v-else-if="kind === 'markdown'" :content="textContent" />
      <PdfViewer v-else-if="kind === 'pdf'" :content="binaryContent" />
      <p v-else class="preview-panel-state-text">{{ $gettext('Preview not ready') }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGettext } from 'vue3-gettext'
import { getPreviewKind, type PreviewKind } from '../composables/usePreviewSupport'
import { useClientService } from '@opencloud-eu/web-pkg'
import TextViewer from './viewers/TextViewer.vue'
import MarkdownPreviewViewer from './viewers/MarkdownPreviewViewer.vue'
import PdfViewer from './viewers/PdfViewer.vue'

const props = defineProps<{ space?: any; resource?: any }>()

const { $gettext } = useGettext()

const kind = computed<PreviewKind | undefined>(() => getPreviewKind(props.resource?.name))
const supported = computed(() => kind.value !== undefined)

const clientService = useClientService()

const loading = ref(false)
const error = ref(false)
const textContent = ref('')
const binaryContent = ref<ArrayBuffer | string | null>(null)
let loadToken = 0

watch(
  () => props.resource,
  (resource) => {
    textContent.value = ''
    binaryContent.value = null
    error.value = false
    if (!resource || !supported.value) return
    const token = ++loadToken
    loadPreview(resource, token)
  },
  { immediate: true }
)

async function loadPreview(resource: any, token: number) {
  loading.value = true
  try {
    const isBinary = kind.value === 'image' || kind.value === 'pdf'
    const { body } = await clientService.webdav.getFileContents(props.space as any, {
      path: resource.path,
      ...(isBinary ? { responseType: 'arraybuffer' } : {})
    }) as any
    if (token !== loadToken) return
    if (typeof body === 'string') {
      if (isBinary) {
        binaryContent.value = body
      } else {
        textContent.value = body
      }
    } else {
      if (isBinary) {
        binaryContent.value = body as ArrayBuffer
      } else {
        textContent.value = new TextDecoder().decode(body)
      }
    }
  } catch (loadErr) {
    if (token !== loadToken) return
    console.error('[PreviewPanel] load failed:', resource.path, loadErr)
    error.value = true
  } finally {
    if (token === loadToken) loading.value = false
  }
}
</script>

<style scoped>
.preview-panel-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 8px;
  gap: 8px;
}
.preview-panel-state-text {
  margin: 0;
  font-size: 13px;
  color: var(--oc-role-text-secondary, #666);
}
.preview-panel-image {
  display: block;
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 4px;
  margin: 0 auto;
}
</style>
