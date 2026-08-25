<template>
  <div class="markdown-preview-body" v-html="rendered"></div>
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
.markdown-preview-body {
  font-size: 14px;
  line-height: 1.6;
  padding: 8px 12px;
  overflow: auto;
  max-height: 600px;
  word-break: break-word;
}
.markdown-preview-body :deep(h1) { font-size: 1.6em; margin: 0.4em 0; }
.markdown-preview-body :deep(h2) { font-size: 1.3em; margin: 0.4em 0; }
.markdown-preview-body :deep(h3) { font-size: 1.1em; margin: 0.3em 0; }
.markdown-preview-body :deep(p) { margin: 0.4em 0; }
.markdown-preview-body :deep(ul), .markdown-preview-body :deep(ol) { padding-left: 1.5em; margin: 0.3em 0; }
.markdown-preview-body :deep(blockquote) {
  border-left: 3px solid var(--oc-role-outline-variant, #ccc);
  margin: 0.5em 0;
  padding: 0.3em 1em;
  color: var(--oc-role-text-secondary, #666);
}
.markdown-preview-body :deep(code) {
  background: var(--oc-role-surface-variant, rgba(0,0,0,0.05));
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}
.markdown-preview-body :deep(pre) {
  background: var(--oc-role-surface-variant, #f5f5f5);
  padding: 8px 12px;
  border-radius: 4px;
  overflow-x: auto;
}
.markdown-preview-body :deep(pre code) { background: none; padding: 0; }
.markdown-preview-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5em 0;
}
.markdown-preview-body :deep(th), .markdown-preview-body :deep(td) {
  border: 1px solid var(--oc-role-outline-variant, #ddd);
  padding: 6px 10px;
  text-align: left;
}
.markdown-preview-body :deep(th) {
  background: var(--oc-role-surface-variant, #f5f5f5);
  font-weight: 600;
}
.markdown-preview-body :deep(a) { color: var(--oc-role-link, #1a73e8); cursor: pointer; }
.markdown-preview-body :deep(a):hover { text-decoration: underline; }
.markdown-preview-body :deep(img) { max-width: 100%; border-radius: 4px; margin: 0.5em 0; }
.markdown-preview-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--oc-role-outline-variant, #ddd);
  margin: 1em 0;
}
</style>
