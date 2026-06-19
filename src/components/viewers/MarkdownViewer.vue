<template>
  <div class="markdown-body" ref="mdRef" v-html="rendered" @click="handleClick"></div>
</template>

<script setup lang="ts">
import { computed, ref, inject, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { marked, Renderer } from 'marked'
import { useRouter } from '@opencloud-eu/web-pkg'
import { ELEMENT_RENDERER_KEY } from '../../composables/useElementRenderer'

const props = defineProps<{ content: string; alt?: string }>()

const router = useRouter()
const ctx = inject(ELEMENT_RENDERER_KEY)
const mdRef = ref<HTMLElement>()

const blobUrls: string[] = []
onUnmounted(() => blobUrls.forEach(u => URL.revokeObjectURL(u)))

function preprocessTags(md: string): string {
  // Replace [[directory:path]] with placeholder divs
  return md.replace(/\[\[directory:([^\]]+)\]\]/g, (_, path) => {
    return `<div data-directory="${path.trim()}" class="md-directory">Laden...</div>`
  })
}

const rendered = computed(() => {
  const renderer = new Renderer()
  const currentPath = (router.currentRoute.value?.path || '').replace(/\/$/, '')

  renderer.link = ({ href, text }) => {
    if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
      return `<a href="${href}" target="_blank">${text}</a>`
    }
    const isFile = /\.\w{2,4}$/.test(href)
    if (isFile) {
      return `<a href="#" data-file-link="${href}">📄 ${text}</a>`
    }
    return `<a href="#" data-folder-link="${href}">${text}</a>`
  }

  renderer.image = ({ href, text }) => {
    if (!href) return ''
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return `<img src="${href}" alt="${text || ''}" />`
    }
    return `<img data-src="${href}" alt="${text || ''}" class="md-img-placeholder" />`
  }

  try {
    const preprocessed = preprocessTags(props.content)
    return marked.parse(preprocessed, { async: false, renderer }) as string
  } catch {
    return `<pre>${props.content}</pre>`
  }
})

// After render, populate [[directory:...]] placeholders
async function populateDirectories() {
  if (!mdRef.value || !ctx) return
  const placeholders = mdRef.value.querySelectorAll('[data-directory]')
  for (const el of placeholders) {
    const dirPath = el.getAttribute('data-directory')
    if (!dirPath) continue
    try {
      const children = await ctx.loadChildren(dirPath)
      const files = children.filter(r => r.type !== 'folder' && !r.name?.startsWith('_type_') && !r.name?.startsWith('.'))
      if (files.length === 0) {
        el.innerHTML = '<em>Keine Dateien gefunden.</em>'
        continue
      }
      el.innerHTML = '<ul class="md-directory-list">' +
        files.map(f => `<li><a href="#" data-file-link="${dirPath}/${f.name}">📄 ${f.name}</a></li>`).join('') +
        '</ul>'
    } catch (err) {
      el.innerHTML = `<em>Verzeichnis "${dirPath}" nicht gefunden.</em>`
    }
  }
}

watch(rendered, () => nextTick(populateDirectories))
onMounted(() => nextTick(populateDirectories))

function handleClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const anchor = target.closest('a')
  if (!anchor) return

  const folderLink = anchor.dataset.folderLink
  const fileLink = anchor.dataset.fileLink

  if (folderLink) {
    e.preventDefault()
    e.stopPropagation()
    const current = router.currentRoute.value
    const currentPath = (current.path || '').replace(/\/$/, '')
    const targetPath = currentPath + '/' + folderLink.replace(/^\//, '')
    const query = { ...current.query }
    delete query.fileId
    delete query.scrollTo
    delete query.page
    router.push({ path: targetPath, query })
  }

  if (fileLink && ctx) {
    e.preventDefault()
    e.stopPropagation()
    ctx.loadContent(fileLink, true).then(entry => {
      const blob = new Blob([entry.content])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileLink.split('/').pop() || 'download'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }).catch(err => {
      console.error('[MarkdownViewer] download failed:', fileLink, err)
    })
  }
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
.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5em 0;
}
.markdown-body :deep(th), .markdown-body :deep(td) {
  border: 1px solid var(--oc-role-outline-variant, #ddd);
  padding: 6px 10px;
  text-align: left;
}
.markdown-body :deep(th) {
  background: var(--oc-role-surface-variant, #f5f5f5);
  font-weight: 600;
}
.markdown-body :deep(a) { color: #1a73e8; cursor: pointer; }
.markdown-body :deep(a):hover { text-decoration: underline; }
.markdown-body :deep(img) { max-width: 100%; border-radius: 4px; margin: 0.5em 0; }
.markdown-body :deep(.md-img-placeholder) {
  background: var(--oc-role-surface-variant, #f0f0f0);
  min-height: 60px;
  display: block;
}
.markdown-body :deep(.md-directory) {
  padding: 8px;
  border: 1px solid var(--oc-role-outline-variant, #e0e0e0);
  border-radius: 6px;
  margin: 0.5em 0;
}
.markdown-body :deep(.md-directory-list) {
  list-style: none;
  padding: 0;
  margin: 0;
}
.markdown-body :deep(.md-directory-list li) {
  padding: 4px 0;
  border-bottom: 1px solid var(--oc-role-outline-variant, #eee);
}
.markdown-body :deep(.md-directory-list li:last-child) { border-bottom: none; }
</style>
