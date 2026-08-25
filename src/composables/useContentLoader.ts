import { ref, type Ref } from 'vue'
import { type SpaceResource } from '@opencloud-eu/web-client'
import { useClientService } from '@opencloud-eu/web-pkg'

interface CacheEntry {
  content: string | ArrayBuffer
  type: 'text' | 'binary'
}

export function useContentLoader(space: Ref<SpaceResource>, concurrency = 4) {
  const clientService = useClientService()
  const cache = new Map<string, CacheEntry>()
  const pending = new Map<string, Promise<CacheEntry>>()
  let active = 0
  const queue: Array<{ path: string; binary: boolean; resolve: (v: CacheEntry) => void; reject: (e: any) => void }> = []

  function drain() {
    while (active < concurrency && queue.length > 0) {
      const item = queue.shift()!
      active++
      doLoad(item.path, item.binary)
        .then(item.resolve)
        .catch(item.reject)
        .finally(() => { active--; drain() })
    }
  }

  async function doLoad(path: string, binary: boolean): Promise<CacheEntry> {
    const sp = space.value
    const key = `${sp?.id || ''}:${path}`
    const url = clientService.webdav.getFileUrl
      ? clientService.webdav.getFileUrl(sp, { path }, {})
      : null
    console.log('[useContentLoader] GET', path, binary ? '(arrayBuffer)' : '(text)', 'url:', url)
    const { body } = await clientService.webdav.getFileContents(sp, {
      path,
      ...(binary ? { responseType: 'arrayBuffer' } : {})
    }) as any
    console.log('[useContentLoader] got', typeof body, body?.constructor?.name, 'len:', body?.byteLength ?? body?.length)
    const entry: CacheEntry = {
      content: typeof body === 'string' ? body : body,
      type: binary ? 'binary' : 'text'
    }
    cache.set(key, entry)
    pending.delete(key)
    return entry
  }

  function loadContent(path: string, binary = false): Promise<CacheEntry> {
    const key = `${space.value?.id || ''}:${path}`
    const cached = cache.get(key)
    if (cached) return Promise.resolve(cached)

    const inflight = pending.get(key)
    if (inflight) return inflight

    const p = new Promise<CacheEntry>((resolve, reject) => {
      queue.push({ path, binary, resolve, reject })
      drain()
    })
    pending.set(key, p)
    return p
  }

  function clearCache() {
    cache.clear()
    pending.clear()
    queue.length = 0
  }

  return { loadContent, clearCache }
}
