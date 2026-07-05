<template>
  <div class="markdown-body" ref="mdRef" v-html="rendered" @click="handleClick"></div>
</template>

<script setup lang="ts">
import { computed, ref, inject, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { marked, Renderer } from 'marked'
import { useRouter, useResourcesStore } from '@opencloud-eu/web-pkg'
import { ELEMENT_RENDERER_KEY } from '../../composables/useElementRenderer'

const props = defineProps<{ content: string; alt?: string }>()

const router = useRouter()
const resourcesStore = useResourcesStore()
const ctx = inject(ELEMENT_RENDERER_KEY)
const mdRef = ref<HTMLElement>()

const blobUrls: string[] = []
onUnmounted(() => blobUrls.forEach(u => URL.revokeObjectURL(u)))

function preprocessTags(md: string): string {
  let result = md

  // [[toc]] → placeholder filled after render
  result = result.replace(/\[\[toc\]\]/gi, '<nav class="md-toc" data-toc></nav>')

  // [[directory:path]]
  result = result.replace(/\[\[directory:([^\]]+)\]\]/g, (_, path) => {
    return `<div data-directory="${path.trim()}" class="md-directory">Loading...</div>`
  })

  // [[link:/path label="text"]] → internal link
  result = result.replace(/\[\[link:([^\s\]]+)\s+label="([^"]+)"\]\]/g, (_, href, label) => {
    const isFile = /\.\w{2,4}$/.test(href)
    if (isFile) return `<a href="#" data-file-link="${href.trim()}">📄 ${label}</a>`
    return `<a href="#" data-folder-link="${href.trim()}">${label}</a>`
  })

  // [[info title="Title" Content]] and [[info Content]]
  result = result.replace(/\[\[info\s+title="([^"]+)"\s+([\s\S]*?)\]\]/g, (_, title, content) => {
    return `<div class="md-callout md-callout-info"><strong>ℹ️ ${title}</strong><br>${content.trim()}</div>`
  })
  result = result.replace(/\[\[info\s+([\s\S]*?)\]\]/g, (_, content) => {
    return `<div class="md-callout md-callout-info">ℹ️ ${content.trim()}</div>`
  })

  // [[warning Content]]
  result = result.replace(/\[\[warning\s+([\s\S]*?)\]\]/g, (_, content) => {
    return `<div class="md-callout md-callout-warning">⚠️ ${content.trim()}</div>`
  })

  // [[danger title="Title" Content]] and [[danger Content]]
  result = result.replace(/\[\[danger\s+title="([^"]+)"\s+([\s\S]*?)\]\]/g, (_, title, content) => {
    return `<div class="md-callout md-callout-danger"><strong>❌ ${title}</strong><br>${content.trim()}</div>`
  })
  result = result.replace(/\[\[danger\s+([\s\S]*?)\]\]/g, (_, content) => {
    return `<div class="md-callout md-callout-danger">❌ ${content.trim()}</div>`
  })

  // [[tip Content]]
  result = result.replace(/\[\[tip\s+([\s\S]*?)\]\]/g, (_, content) => {
    return `<div class="md-callout md-callout-tip">💡 ${content.trim()}</div>`
  })

  // [[badge text="Label" color="green"]]
  result = result.replace(/\[\[badge\s+text="([^"]+)"\s+color="([^"]+)"\]\]/g, (_, text, color) => {
    return `<span class="md-badge md-badge-${color}">${text}</span>`
  })

  return result
}

const rendered = computed(() => {
  const renderer = new Renderer()
  const currentPath = (router.currentRoute.value?.path || '').replace(/\/$/, '')

  renderer.link = ({ href, text }) => {
    if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
      return `<a href="${href}" target="_blank">${text}</a>`
    }
    // .md files: navigate to their parent folder (they render inline in element view)
    const isMd = /\.md$/i.test(href)
    if (isMd) {
      const parentDir = href.includes('/') ? href.replace(/\/[^/]+$/, '') : ''
      if (parentDir) {
        return `<a href="#" data-folder-link="${parentDir}">${text}</a>`
      }
      // Same folder — just a label, no navigation needed
      return `<span class="md-link-current">${text}</span>`
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

function resolveRelativePath(base: string, rel: string): string {
  if (rel.startsWith('/')) return rel
  const parts = base.replace(/\/$/, '').split('/')
  for (const seg of rel.split('/')) {
    if (seg === '..') parts.pop()
    else if (seg !== '.' && seg !== '') parts.push(seg)
  }
  return parts.join('/') || '/'
}

// After render, populate [[directory:...]] placeholders
async function populateDirectories() {
  if (!mdRef.value || !ctx) return
  const currentFolder = resourcesStore?.currentFolder?.path || ''
  const placeholders = mdRef.value.querySelectorAll('[data-directory]')
  for (const el of placeholders) {
    const rawPath = el.getAttribute('data-directory')
    if (!rawPath) continue
    const dirPath = resolveRelativePath(currentFolder, rawPath)
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

function populateToc() {
  if (!mdRef.value) return
  const tocEl = mdRef.value.querySelector('[data-toc]')
  if (!tocEl) return
  const headings = mdRef.value.querySelectorAll('h2, h3')
  if (headings.length === 0) { tocEl.remove(); return }
  let html = '<ul class="md-toc-list">'
  headings.forEach((h, i) => {
    const id = `md-heading-${i}`
    h.setAttribute('id', id)
    const indent = h.tagName === 'H3' ? ' class="md-toc-indent"' : ''
    html += `<li${indent}><a href="#${id}">${h.textContent}</a></li>`
  })
  html += '</ul>'
  tocEl.innerHTML = html
}

function populateAll() {
  populateToc()
  populateDirectories()
}

watch(rendered, () => nextTick(populateAll))
onMounted(() => nextTick(populateAll))

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
    const routerPath = (current.path || '').replace(/\/$/, '')
    // Resolve the space-internal path to compute the space root in the router
    const spacePath = resourcesStore?.currentFolder?.path || ''
    const spaceRoot = spacePath && spacePath !== '/'
      ? routerPath.slice(0, routerPath.length - spacePath.length)
      : routerPath
    let targetPath: string
    if (folderLink.startsWith('/')) {
      // Absolute from space root: [[link:/it/vpn ...]]
      targetPath = spaceRoot + folderLink
    } else {
      // Relative to current folder: [text](subfolder)
      targetPath = routerPath + '/' + folderLink
    }
    const query = { ...current.query }
    delete query.fileId
    delete query.scrollTo
    delete query.page
    router.push({ path: targetPath, query })
  }

  // TOC anchor click → scroll to heading
  const href = anchor.getAttribute('href')
  if (href?.startsWith('#md-heading-') && mdRef.value) {
    e.preventDefault()
    e.stopPropagation()
    const target2 = mdRef.value.querySelector(href)
    target2?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }

  if (fileLink && ctx) {
    e.preventDefault()
    e.stopPropagation()
    const currentFolder = resourcesStore?.currentFolder?.path || ''
    const resolvedFile = fileLink.startsWith('/') ? fileLink : resolveRelativePath(currentFolder, fileLink)
    ctx.loadContent(resolvedFile, true).then(entry => {
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
/* TOC */
.markdown-body :deep(.md-toc) { margin: 0.5em 0; padding: 8px 12px; background: var(--oc-role-surface-variant, #f8f8f8); border-radius: 6px; border: 1px solid var(--oc-role-outline-variant, #e0e0e0); }
.markdown-body :deep(.md-toc-list) { list-style: none; padding: 0; margin: 0; }
.markdown-body :deep(.md-toc-list li) { padding: 2px 0; }
.markdown-body :deep(.md-toc-indent) { padding-left: 1.2em; }
.markdown-body :deep(.md-toc-list a) { text-decoration: none; }
/* Callouts */
.markdown-body :deep(.md-callout) { padding: 10px 14px; border-radius: 6px; margin: 0.5em 0; border-left: 4px solid; }
.markdown-body :deep(.md-callout-info) { background: #e3f2fd; border-color: #1976d2; color: #0d47a1; }
.markdown-body :deep(.md-callout-warning) { background: #fff3e0; border-color: #f57c00; color: #e65100; }
.markdown-body :deep(.md-callout-danger) { background: #ffebee; border-color: #d32f2f; color: #b71c1c; }
.markdown-body :deep(.md-callout-tip) { background: #e8f5e9; border-color: #388e3c; color: #1b5e20; }
/* Badges */
.markdown-body :deep(.md-badge) { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 0.85em; font-weight: 600; }
.markdown-body :deep(.md-badge-green) { background: #e8f5e9; color: #2e7d32; }
.markdown-body :deep(.md-badge-blue) { background: #e3f2fd; color: #1565c0; }
.markdown-body :deep(.md-badge-red) { background: #ffebee; color: #c62828; }
.markdown-body :deep(.md-badge-orange) { background: #fff3e0; color: #e65100; }
.markdown-body :deep(.md-badge-gray) { background: #f5f5f5; color: #616161; }
</style>
