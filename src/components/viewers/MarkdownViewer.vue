<template>
  <div class="markdown-body" v-html="rendered"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{ content: string }>()

const rendered = computed(() => {
  try {
    return marked.parse(props.content, { async: false }) as string
  } catch {
    return `<pre>${props.content}</pre>`
  }
})
</script>

<style scoped>
.markdown-body {
  font-size: 14px;
  line-height: 1.6;
  padding: 8px 12px;
  overflow: auto;
  max-height: 600px;
}
.markdown-body :deep(h1) { font-size: 1.6em; margin: 0.4em 0; }
.markdown-body :deep(h2) { font-size: 1.3em; margin: 0.4em 0; }
.markdown-body :deep(h3) { font-size: 1.1em; margin: 0.3em 0; }
.markdown-body :deep(p) { margin: 0.4em 0; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { padding-left: 1.5em; margin: 0.3em 0; }
.markdown-body :deep(blockquote) {
  border-left: 3px solid #ccc;
  margin: 0.5em 0;
  padding: 0.3em 1em;
  color: #666;
}
.markdown-body :deep(code) {
  background: rgba(0,0,0,0.05);
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}
.markdown-body :deep(a) { color: #1a73e8; }
</style>
