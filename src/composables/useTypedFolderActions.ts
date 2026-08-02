import { computed, unref, Ref } from 'vue'
import { SpaceResource, Resource } from '@opencloud-eu/web-client'
import { useClientService, useMessages, useResourcesStore } from '@opencloud-eu/web-pkg'
import { TypedFolderSchema } from './types'
import { getFileReference } from './useFileReference'

export function useTypedFolderActions(
  space: Ref<SpaceResource>,
  currentFolder: Ref<Resource>,
  schema: Ref<TypedFolderSchema | null>
) {
  const clientService = useClientService()
  const { showMessage, showErrorMessage } = useMessages()
  const resourcesStore = useResourcesStore()

  /**
   * Compute the next file reference (Aktenzeichen) based on the schema pattern
   * and existing siblings.
   */
  async function computeNextFileReference(childType: string): Promise<string> {
    const sp = unref(space)
    const folder = unref(currentFolder)
    const s = unref(schema)
    if (!sp || !folder || !s) return ''

    const parentRef = getFileReference(folder)
    const isRoot = !folder.path || folder.path === '/'

    try {
      // Find highest sequence among siblings
      const { children } = await clientService.webdav.listFiles(sp, { path: folder.path })
      let maxSeq = 0

      for (const child of children) {
        if (child.type !== 'folder') continue
        const ref = getFileReference(child)
        if (!ref) continue
        // Extract the last numeric part
        const parts = ref.split(/[.\-/#]/).filter(Boolean)
        if (parts.length > 0) {
          const num = parseInt(parts[parts.length - 1], 10)
          if (!isNaN(num) && num > maxSeq) maxSeq = num
        }
      }

      const nextSeq = maxSeq + 1

      if (isRoot || !parentRef) {
        // Top-level: just a zero-padded sequence number
        return String(nextSeq).padStart(2, '0')
      }

      // Nested: parentRef + separator + sequence
      return `${parentRef}.${String(nextSeq).padStart(2, '0')}`
    } catch {
      return ''
    }
  }

  /**
   * Create a typed child folder with type marker and file reference.
   */
  async function createTypedChild(childType: string, name: string, extraMeta?: Record<string, string>, fileReference?: string) {
    const sp = unref(space)
    const folder = unref(currentFolder)
    if (!sp || !folder) return

    const path = folder.path.replace(/\/?$/, `/${name}`)
    const folderPath = folder.path || ''
    const isRoot = !folderPath || folderPath === '/'

    try {
      // 0. Unprotect parent if needed (Manager on protected folder)
      const httpClient = (clientService as any).httpAuthenticated
      const parentImmutable = (folder as any)?.immutableState || ''
      const parentItemId = `${sp.id}!${folder.id.split('!').pop()}`
      if (parentImmutable === 'protected' && httpClient) {
        await httpClient.delete(`/graph/v1beta1/drives/${sp.id}/items/${parentItemId}/protect`)
      }

      // 1. Create folder
      await clientService.webdav.createFolder(sp, { path })

      // 2. Create _type_ marker
      await clientService.webdav.putFileContents(sp, {
        path: path + `/_type_${childType}`,
        content: ''
      })

      // 3. Get the new folder's ID
      const { children } = await clientService.webdav.listFiles(sp, { path: folder.path })
      const newFolder = children.find((r) => r.name === name)
      if (!newFolder) throw new Error('Folder not found after creation')

      // 4. Compute and set file reference + app + extra metadata
      // Use explicit fileReference if provided ('' = no AZ, undefined = auto-compute)
      const fileRef = fileReference !== undefined ? fileReference : await computeNextFileReference(childType)
      const httpClient2 = (clientService as any).httpAuthenticated
      if (httpClient2) {
        const itemId = `${sp.id}!${newFolder.id.split('!').pop()}`
        const meta: Record<string, string> = {}
        meta['oy.ftype'] = childType
        if (fileRef) meta['oy.fileReference'] = fileRef

        // Check if child schema defines an app → set oy.app (legacy)
        try {
          const { body: childBody } = await clientService.webdav.getFileContents(sp, {
            path: `.views/${childType}.viewtype`
          }) as any
          const childSchema = JSON.parse(typeof childBody === 'string' ? childBody : new TextDecoder().decode(childBody))
          if (childSchema?.app) meta['oy.app'] = childSchema.app
        } catch { /* ignore */ }

        // Merge extra metadata (color, note, etc.)
        if (extraMeta) Object.assign(meta, extraMeta)

        if (Object.keys(meta).length > 0) {
          await httpClient2.put(
            `/graph/v1beta1/drives/${sp.id}/items/${itemId}/metadata`,
            meta
          )
        }
      }

      // 5. Protect only at space root (top-level structure)
      if (isRoot && httpClient) {
        try {
          const { body: childBody } = await clientService.webdav.getFileContents(sp, {
            path: `.views/${childType}.viewtype`
          }) as any
          const childSchema = JSON.parse(typeof childBody === 'string' ? childBody : new TextDecoder().decode(childBody))
          if (childSchema?.protectButtonVisible) {
            const newItemId = `${sp.id}!${newFolder.id.split('!').pop()}`
            await httpClient.post(`/graph/v1beta1/drives/${sp.id}/items/${newItemId}/protect`)
          }
        } catch { /* ignore */ }
      }

      // 6. Re-protect parent if we unprotected it
      if (parentImmutable === 'protected' && httpClient) {
        try {
          await httpClient.post(`/graph/v1beta1/drives/${sp.id}/items/${parentItemId}/protect`)
        } catch { /* ignore */ }
      }

      // 7. Reload to pick up new extraProps (oy.app etc.)
      showMessage({ title: `${name} erstellt` })
      window.location.reload()
    } catch (e) {
      // Re-protect parent on error
      const httpClient = (clientService as any).httpAuthenticated
      const parentImmutable = (folder as any)?.immutableState || ''
      if (parentImmutable === 'protected' && httpClient) {
        const parentItemId = `${sp.id}!${folder.id.split('!').pop()}`
        try {
          await httpClient.post(`/graph/v1beta1/drives/${sp.id}/items/${parentItemId}/protect`)
        } catch { /* ignore */ }
      }
      showErrorMessage({
        title: 'Fehler beim Erstellen',
        errors: [e as Error]
      })
    }
  }

  /**
   * Get the allowed child types for the current folder.
   */
  const allowedChildren = computed(() => {
    const s = unref(schema)
    if (!s?.children) return []

    let types: string[]
    if (Array.isArray(s.children)) {
      types = s.children
    } else {
      const folder = unref(currentFolder)
      const state = (folder as any)?.immutableState || ''
      if (state === 'protected' && (s.children as any).protected) {
        types = (s.children as any).protected
      } else if (state === 'shielded' && (s.children as any).shielded) {
        types = (s.children as any).shielded
      } else {
        types = (s.children as any).default || []
      }
    }

    return types
  })

  /**
   * Check if the current user can create children.
   * Manager/SpaceAdmin can create even in protected folders (via unprotect/protect).
   */
  const canCreate = computed(() => {
    const folder = unref(currentFolder) as any
    if (!folder) return false
    const s = unref(schema)
    // If schema has children, show create buttons.
    // Actual permission check happens on creation (error message if denied).
    return !!s?.children && (Array.isArray(s.children) ? s.children.length > 0 : true)
  })

  /**
   * Whether creating requires unprotect/protect cycle (Manager on protected folder).
   */
  const needsUnprotect = computed(() => {
    const folder = unref(currentFolder)
    if (!folder) return false
    const perms = (folder as any).permissions || ''
    const immutableState = (folder as any)?.immutableState || ''
    return (immutableState === 'protected') && !perms.includes('C') && perms.includes('Z')
  })

  return {
    createTypedChild,
    computeNextFileReference,
    allowedChildren,
    canCreate,
    needsUnprotect
  }
}
