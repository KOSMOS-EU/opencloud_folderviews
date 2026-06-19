<template>
  <div class="element-content" ref="elRef">
    <div v-if="loading" class="element-loading">
      <oc-spinner size="small" />
    </div>
    <div v-else-if="error" class="element-error">{{ error }}</div>
    <component
      v-else-if="viewer && content != null"
      :is="viewer"
      :content="content"
      :alt="resource.name"
    />
    <div v-else-if="!viewer" class="element-fallback">
      <oc-icon name="file" size="small" />
      <span>{{ resource.name }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, watch, onMounted, onUnmounted, type Component } from 'vue'
import { type Resource } from '@opencloud-eu/web-client'
import { type TypedFolderSchema } from '../composables/types'
import { ELEMENT_RENDERER_KEY } from '../composables/useElementRenderer'

const props = defineProps<{
  resource: Resource
  schema: TypedFolderSchema | null
}>()

const ctx = inject(ELEMENT_RENDERER_KEY)!
const elRef = ref<HTMLElement>()
const loading = ref(false)
const error = ref('')
const content = ref<string | ArrayBuffer | null>(null)

const ext = computed(() => (props.resource.name || '').split('.').pop()?.toLowerCase() || '')
const isBinary = computed(() => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext.value))
const viewer = computed(() => ctx.resolveViewer(props.schema, ext.value))

let observer: IntersectionObserver | null = null
let loaded = false

function loadOnVisible() {
  if (!viewer.value || !props.resource.path || loaded) return
  loaded = true
  loading.value = true
  ctx.loadContent(props.resource.path, isBinary.value)
    .then(entry => { content.value = entry.content })
    .catch(e => { error.value = e?.message || 'Load error' })
    .finally(() => { loading.value = false })
}

onMounted(() => {
  if (!viewer.value) return
  observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      observer?.disconnect()
      loadOnVisible()
    }
  }, { rootMargin: '200px' })
  if (elRef.value) observer.observe(elRef.value)
})

// If viewer becomes available after mount (schema loaded late), start observing
watch(viewer, (v) => {
  if (v && !loaded && elRef.value) {
    if (!observer) {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          observer?.disconnect()
          loadOnVisible()
        }
      }, { rootMargin: '200px' })
    }
    observer.observe(elRef.value)
  }
})

onUnmounted(() => { observer?.disconnect() })
</script>

<style scoped>
.element-loading, .element-error, .element-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  min-height: 40px;
}
.element-error { color: #c62828; font-size: 12px; }
.element-fallback { color: #888; font-size: 12px; }
</style>
