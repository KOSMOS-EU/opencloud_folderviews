<template>
  <div class="image-viewer">
    <img v-if="objectUrl" :src="objectUrl" :alt="alt" />
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch } from 'vue'

const props = withDefaults(defineProps<{ content: ArrayBuffer | null; alt?: string }>(), {
  content: null
})
const objectUrl = ref('')

watch(() => props.content, (buf) => {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
  objectUrl.value = ''
  if (!buf) return
  console.log('[ImageViewer] content:', Object.prototype.toString.call(buf), 'bytes:', buf.byteLength, 'head:', new Uint8Array(buf, 0, 16).join(','))
  const blob = new Blob([buf], { type: 'application/octet-stream' })
  objectUrl.value = URL.createObjectURL(blob)
  console.log('[ImageViewer] objectUrl:', objectUrl.value)
}, { immediate: true })

onUnmounted(() => {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
})
</script>

<style scoped>
.image-viewer { display: flex; justify-content: center; padding: 4px; }
.image-viewer img { max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 4px; }
</style>
