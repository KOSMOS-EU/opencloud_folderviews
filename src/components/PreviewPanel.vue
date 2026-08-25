<template>
  <div class="p-4 preview-panel">
    <div v-if="!supported" class="preview-panel-state">
      <oc-icon name="file" fill-type="line" size="large" />
      <p class="preview-panel-state-text">{{ $gettext('No preview available') }}</p>
    </div>
    <template v-else>
      <oc-spinner v-if="loading" :size="32" />
      <p v-else-if="error" class="preview-panel-state-text">{{ $gettext('No preview available') }}</p>
      <ImageViewer v-else-if="kind === 'image'" :content="(binaryContent as ArrayBuffer)" :alt="resource?.name" />
      <TextViewer v-else-if="kind === 'text'" :content="textContent" />
      <MarkdownViewer v-else-if="kind === 'markdown'" :content="textContent" />
      <p v-else class="preview-panel-state-text">{{ $gettext('Preview not ready') }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGettext } from 'vue3-gettext'
import { getPreviewKind, type PreviewKind } from '../composables/usePreviewSupport'
import { useContentLoader } from '../composables/useContentLoader'
import ImageViewer from './viewers/ImageViewer.vue'
import TextViewer from './viewers/TextViewer.vue'
import MarkdownViewer from './viewers/MarkdownViewer.vue'

const props = defineProps<{ space?: any; resource?: any }>()

const { $gettext } = useGettext()

const kind = computed<PreviewKind | undefined>(() => getPreviewKind(props.resource?.name))
const supported = computed(() => kind.value !== undefined)

const contentLoader = useContentLoader(computed(() => props.space as any))

const loading = ref(false)
const error = ref(false)
const textContent = ref('')
const binaryContent = ref<ArrayBuffer | null>(null)

watch(
  () => props.resource,
  (resource) => {
    textContent.value = ''
    binaryContent.value = null
    error.value = false
    if (!resource || !supported.value) return
    if (kind.value === 'pdf') return
    loadPreview(resource)
  },
  { immediate: true }
)

async function loadPreview(resource: any) {
  loading.value = true
  try {
    const isBinary = kind.value === 'image'
    const entry = await contentLoader.loadContent(resource.path, isBinary)
    if (entry.type === 'binary') {
      binaryContent.value = entry.content as ArrayBuffer
    } else {
      textContent.value = entry.content as string
    }
  } catch (loadErr) {
    console.error('[PreviewPanel] load failed:', resource.path, loadErr)
    error.value = true
  } finally {
    loading.value = false
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
