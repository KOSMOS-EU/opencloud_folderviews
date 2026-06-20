import { ref, Ref, unref, watch } from 'vue'
import { SpaceResource } from '@opencloud-eu/web-client'
import { useClientService } from '@opencloud-eu/web-pkg'

/**
 * Parse a class file: one token per line, # comments, inline # annotations.
 */
export function parseClassFile(content: string): string[] {
  return content
    .split('\n')
    .map(line => line.split('#')[0].trim())
    .filter(t => t.length > 0 && /^[a-zA-Z0-9._-]+$/.test(t))
}

/**
 * Load and parse class files from .classes/ in a space.
 */
export function useClasses(space: Ref<SpaceResource>) {
  const clientService = useClientService()
  const classFiles = ref<{ name: string; tokens: string[] }[]>([])
  const loading = ref(false)

  async function loadClasses() {
    const sp = unref(space)
    if (!sp) return
    loading.value = true
    try {
      const { children } = await clientService.webdav.listFiles(sp, { path: '.classes' })
      const mdFiles = children.filter(r => r.name?.endsWith('.md'))

      const results = await Promise.all(mdFiles.map(async (f) => {
        try {
          const { body } = await clientService.webdav.getFileContents(sp, {
            path: `.classes/${f.name}`
          }) as any
          const text = typeof body === 'string' ? body : new TextDecoder().decode(body)
          return { name: f.name!.replace('.md', ''), tokens: parseClassFile(text) }
        } catch {
          return { name: f.name!.replace('.md', ''), tokens: [] }
        }
      }))

      classFiles.value = results
    } catch {
      classFiles.value = []
    } finally {
      loading.value = false
    }
  }

  watch(space, () => loadClasses(), { immediate: true })

  return { classFiles, loading, loadClasses }
}
