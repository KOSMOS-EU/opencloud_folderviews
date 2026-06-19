<template>
  <div class="markdown-body" ref="mdRef" v-html="rendered" @click="handleClick"></div>
</template>

<script setup lang="ts">
import { computed, ref, inject } from 'vue'
import { marked } from 'marked'
import { useRouter, useRoute } from '@opencloud-eu/web-pkg'

const props = defineProps<{ content: string; alt?: string }>()

const router = useRouter()
const route = useRoute()
const mdRef = ref<HTMLElement>()

const rendered = computed(() => {
  try {
    return marked.parse(props.content, { async: false }) as string
  } catch {
    return `<pre>${props.content}</pre>`
  }
})

function handleClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const anchor = target.closest('a')
  if (!anchor) return

  const href = anchor.getAttribute('href') || ''

  // External links: let browser handle
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) return

  // Relative link → navigate to folder
  e.preventDefault()
  e.stopPropagation()

  // Build the target path relative to current route
  const currentPath = route.path
  // Current path is like /files/spaces/project/intranet
  // href is like "News" or "Rechtliches/Impressum"
  const targetPath = currentPath.replace(/\/$/, '') + '/' + href.replace(/^\//, '')

  router.push({ path: targetPath })
}
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
.markdown-body :deep(a) { color: #1a73e8; cursor: pointer; }
.markdown-body :deep(a):hover { text-decoration: underline; }
</style>
