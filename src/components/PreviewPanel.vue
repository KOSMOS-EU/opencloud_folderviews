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
      <PdfViewer v-else-if="kind === 'pdf'" :content="(binaryContent as ArrayBuffer)" />
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
    if (kind.value === 'image') {
      const url = await buildImagePreviewUrl(resource)
      if (token === loadToken) binaryContent.value = url
      return
    }
    const isBinary = kind.value === 'pdf'
    const { body } = await clientService.webdav.getFileContents(props.space as any, {
      path: resource.path,
      ...(isBinary ? { responseType: 'arraybuffer' } : {})
    }) as any
    if (token !== loadToken) return
    if (isBinary) {
      if (body instanceof ArrayBuffer) {
        binaryContent.value = body
      } else if (typeof body === 'string' && /^[A-Za-z0-9+/=\s]{24,}$/.test(body.slice(0, 32))) {
        // Host-Axios liefert arraybuffer-Requests manchmal als base64-String
        binaryContent.value = base64ToArrayBuffer(body)
      } else {
        throw new Error('unexpected body type: ' + Object.prototype.toString.call(body))
      }
    } else {
      textContent.value = typeof body === 'string' ? body : new TextDecoder().decode(body)
    }
  } catch (loadErr) {
    if (token !== loadToken) return
    console.error('[PreviewPanel] load failed:', resource.path, loadErr)
    error.value = true
  } finally {
    if (token === loadToken) loading.value = false
  }
}

// Dieselbe Preview-Service-URL wie die Details-Sidebar des Hosts:
// /dav/<space-webdav-path>/<datei>?scalingup=0&preview=1&a=1&x=…&y=…&processor=fit
// Der Browser laedt sie mit der Session und rendert das skalierte Bild direkt.
async function buildImagePreviewUrl(resource: any): Promise<string> {
  const space = props.space as any
  const webDavPath = [space.webDavPath, resource.path]
    .filter(Boolean)
    .join('/')
    .replace(/\/{2,}/g, '/')
  const dims: [number, number] = [800, 600]
  const params = new URLSearchParams()
  params.set('scalingup', '0')
  params.set('preview', '1')
  params.set('a', '1')
  params.set('x', String(dims[0]))
  params.set('y', String(dims[1]))
  params.set('processor', 'fit')
  if (resource.etag) params.set('c', String(resource.etag).replaceAll('"', ''))
  return `${window.location.origin}/dav/${webDavPath}?${params.toString()}`
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
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
