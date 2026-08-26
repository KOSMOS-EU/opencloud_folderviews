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

  function buildDavUrl(sp: SpaceResource, path: string): string {
    // httpAuthenticated already has baseURL = serverUrl, so use a relative URL
    const davBase = sp.webDavPath || ''
    const encoded = path.split('/').map(encodeURIComponent).join('/')
    const joined = (davBase + '/' + encoded).replace(/\/+/g, '/')
    return ['remote.php/dav', joined.replace(/^\//, '')].filter(Boolean).join('/').replace(/\/{2,}/g, '/')
  }

  async function doLoad(path: string, binary: boolean): Promise<CacheEntry> {
    const sp = space.value
    const url = buildDavUrl(sp, path)
    const options: any = binary ? { responseType: 'blob' } : { responseType: 'text' }
    const resp = await clientService.httpAuthenticated.get(url, options)
    const data: any = resp.data
    let content: string | ArrayBuffer
    if (binary) {
      const blob: Blob = data
      content = await blob.arrayBuffer()
    } else {
      content = typeof data === 'string' ? data : await new Response(data).text()
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
