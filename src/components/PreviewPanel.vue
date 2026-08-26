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
      <ImageViewer v-else-if="kind === 'image'" :content="(binaryContent as ArrayBuffer)" :alt="resourceName" />
      <MarkdownPreviewViewer v-else-if="kind === 'markdown'" :content="textContent" />
      <PdfViewer v-else-if="kind === 'pdf'" :content="binaryContent" />
      <!-- office lädt asynchron selbst (Collabora iframe), Panel-Spinner daher nicht -->
      <OfficeViewer v-else-if="kind === 'office'" :space="space" :resource="selectedResource" />
      <MailViewer v-else-if="kind === 'mail'" :content="binaryContent" :name="resourceName" />
      <p v-else class="preview-panel-state-text">{{ $gettext('Preview not ready') }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useResourcesStore, useSpacesStore } from '@opencloud-eu/web-pkg'
import { getPreviewKind, type PreviewKind } from '../composables/usePreviewSupport'
import { useContentLoader } from '../composables/useContentLoader'
import TextViewer from './viewers/TextViewer.vue'
import ImageViewer from './viewers/ImageViewer.vue'
import MarkdownPreviewViewer from './viewers/MarkdownPreviewViewer.vue'
import PdfViewer from './viewers/PdfViewer.vue'
import OfficeViewer from './viewers/OfficeViewer.vue'
import MailViewer from './viewers/MailViewer.vue'

// Accept props as fallback (componentAttrs may pass them),
// but prefer reactive store lookup so the panel works even when
// componentAttrs is called with a stale/empty context.
const props = defineProps<{ space?: any; resource?: any }>()

const { $gettext } = useGettext()
const resourcesStore = useResourcesStore()
const spacesStore = useSpacesStore()

// Resolve the selected resource reactively from the store.
// The sidebar panel context passed via componentAttrs is not always
// reliable (it may be empty at render time), so we fall back to
// the store's selectedIds + resources list.
const selectedResource = computed(() => {
  // First try the prop (if componentAttrs passed a valid resource)
  if (props.resource?.name) return props.resource
  // Fallback: look up by selectedIds in the resources store
  const selectedIds: string[] = resourcesStore.selectedIds || []
  if (selectedIds.length !== 1) return null
  const resources: any[] = resourcesStore.resources || []
  return resources.find((r) => r.id === selectedIds[0]) || null
})

const resourceName = computed(() => selectedResource.value?.name || '')

// Space: must be a Space object (with webDavPath = /spaces/<id>),
// NOT a Folder (whose webDavPath includes the folder path).
const space = computed(() => {
  if (props.space?.id) return props.space
  const res = selectedResource.value
  if (res?.space) return res.space
  return spacesStore.currentSpace || null
})

const kind = computed<PreviewKind | undefined>(() => getPreviewKind(resourceName.value))
const supported = computed(() => kind.value !== undefined)

const contentLoader = useContentLoader(computed(() => space.value as any))

const loading = ref(false)
const error = ref(false)
const textContent = ref('')
const binaryContent = ref<ArrayBuffer | null>(null)

let loadSeq = 0

watch([selectedResource, kind], ([resource, previewKind], oldResource) => {
  if (!resource || previewKind === undefined) {
    textContent.value = ''
    binaryContent.value = null
    error.value = false
    return
  }
  // Resource (or its kind) changed → fresh load. The cache in
  // useContentLoader dedupes identical paths, so re-selecting the
  // same file is cheap.
  const seq = ++loadSeq
  textContent.value = ''
  binaryContent.value = null
  error.value = false
  void loadPreview(resource, previewKind, seq)
}, { immediate: true })

async function loadPreview(resource: any, previewKind: PreviewKind, seq: number) {
  loading.value = true
  console.debug('[PreviewPanel] loading', resource.name, 'kind=' + previewKind, 'seq=' + seq)
  try {
    const isBinary = previewKind === 'image' || previewKind === 'pdf' || previewKind === 'mail'
    const entry = await contentLoader.loadContent(resource.path, isBinary)
    // A newer load superseded this one → discard its result
    if (seq !== loadSeq) return
    if (entry.type === 'binary') {
      binaryContent.value = entry.content as ArrayBuffer
      console.debug('[PreviewPanel] binary ok', resource.name, (entry.content as ArrayBuffer).byteLength, 'bytes')
    } else {
      textContent.value = entry.content as string
      console.debug('[PreviewPanel] text ok', resource.name, (entry.content as string).length, 'chars')
    }
  } catch (loadErr) {
    if (seq !== loadSeq) return
    console.error('[PreviewPanel] load failed:', resource.path, loadErr)
    error.value = true
  } finally {
    if (seq === loadSeq) loading.value = false
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
</style>
