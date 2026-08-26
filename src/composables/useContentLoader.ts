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
    const { body } = await clientService.webdav.getFileContents(sp, {
      path,
      ...(binary ? { responseType: 'blob' } : {})
    }) as any
    let content: string | ArrayBuffer
    if (binary) {
      // web-client resolves a Blob for responseType 'blob' — read it as ArrayBuffer
      const blob: Blob = body
      content = await blob.arrayBuffer()
    } else {
      content = typeof body === 'string' ? body : await new Response(body).text()
    }
    const entry: CacheEntry = {
      content,
      type: binary ? 'binary' : 'text'
    }
    cache.set(path, entry)
    pending.delete(path)
    return entry
  }

  function loadContent(path: string, binary = false): Promise<CacheEntry> {
    const cached = cache.get(path)
    if (cached) return Promise.resolve(cached)

    const inflight = pending.get(path)
    if (inflight) return inflight

    const p = new Promise<CacheEntry>((resolve, reject) => {
      queue.push({ path, binary, resolve, reject })
      drain()
    })
    pending.set(path, p)
    return p
  }

  function clearCache() {
    cache.clear()
    pending.clear()
    queue.length = 0
  }

  return { loadContent, clearCache }
}
