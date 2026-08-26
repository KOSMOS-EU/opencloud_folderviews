import { ref, type Ref } from 'vue'
import { type SpaceResource } from '@opencloud-eu/web-client'
import { useClientService } from '@opencloud-eu/web-pkg'

interface CacheEntry {
  content: string | ArrayBuffer
  type: 'text' | 'binary'
}

async function toArrayBuffer(body: any): Promise<ArrayBuffer> {
  // Blob / File
  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    return body.arrayBuffer()
  }
  // ArrayBuffer / TypedArray
  if (body instanceof ArrayBuffer) {
    return body
  }
  if (ArrayBuffer.isView(body)) {
    return (body as any).buffer.slice(
      (body as any).byteOffset,
      (body as any).byteOffset + (body as any).byteLength
    )
  }
  // String (fallback — text content in binary slot)
  if (typeof body === 'string') {
    const encoder = new TextEncoder()
    return encoder.encode(body).buffer
  }
  // Last resort: wrap in Blob and read
  return new Blob([body]).arrayBuffer()
}

async function toText(body: any): Promise<string> {
  if (typeof body === 'string') return body
  if (typeof Blob !== 'undefined' && body instanceof Blob) return body.text()
  if (body instanceof ArrayBuffer) return new TextDecoder().decode(body)
  if (ArrayBuffer.isView(body)) return new TextDecoder().decode(body)
  return String(body)
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
      ...(binary ? { responseType: 'arrayBuffer' } : {})
    }) as any
    const entry: CacheEntry = {
      content: binary ? await toArrayBuffer(body) : await toText(body),
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
