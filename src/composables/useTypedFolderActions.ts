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
    if (!parentRef) return ''

    // Load child schema to get its fileReferencePattern
    try {
      const { body } = await clientService.webdav.getFileContents(sp, {
        path: `.views/${childType}.json`
      }) as any
      const childSchema = JSON.parse(typeof body === 'string' ? body : new TextDecoder().decode(body))
      const pattern = childSchema?.fileReferencePattern || ''
      if (!pattern) return ''

      // Find highest sequence among siblings
      const { children } = await clientService.webdav.listFiles(sp, { path: folder.path })
      let maxSeq = 0
      const separator = pattern.includes('-') ? '-' : pattern.includes('/') ? '/' : pattern.includes('#') ? '#' : '.'

      for (const child of children) {
        if (child.type !== 'folder') continue
        const ref = getFileReference(child)
        if (!ref || !ref.startsWith(parentRef)) continue
        const suffix = ref.substring(parentRef.length)
        // Extract the last numeric part after the separator
        const parts = suffix.split(/[.\-/#]/).filter(Boolean)
        if (parts.length > 0) {
          const num = parseInt(parts[parts.length - 1], 10)
          if (!isNaN(num) && num > maxSeq) maxSeq = num
        }
      }

      const nextSeq = maxSeq + 1

      // Build the reference from pattern
      // Patterns: {parentRef}.{seq:02}, {parentRef}-{seq:02}, {parentRef}/{seq}, {parentRef}#{seq}
      let ref = pattern
        .replace('{parentRef}', parentRef)
        .replace(/\{seq:(\d+)\}/g, (_, digits) => String(nextSeq).padStart(parseInt(digits), '0'))
        .replace('{seq}', String(nextSeq))

      return ref
    } catch {
      return ''
    }
  }

  /**
   * Create a typed child folder with type marker and file reference.
   */
  async function createTypedChild(childType: string, name: string) {
    const sp = unref(space)
    const folder = unref(currentFolder)
    if (!sp || !folder) return

    const path = folder.path.replace(/\/?$/, `/${name}`)

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

      // 4. Compute and set file reference
      const fileRef = await computeNextFileReference(childType)
      if (fileRef) {
        const httpClient = (clientService as any).httpAuthenticated
        if (httpClient) {
          const itemId = `${sp.id}!${newFolder.id.split('!').pop()}`
          await httpClient.put(
            `/graph/v1beta1/drives/${sp.id}/items/${itemId}/metadata`,
            { 'oy.fileReference': fileRef }
          )
        }
      }

      // 5. Protect the new folder if its schema has protectButtonVisible
      //    (Aktenstruktur / Lernplan — child folders get protected on creation)
      if (httpClient) {
        try {
          const { body: childBody } = await clientService.webdav.getFileContents(sp, {
            path: `.views/${childType}.json`
          }) as any
          const childSchema = JSON.parse(typeof childBody === 'string' ? childBody : new TextDecoder().decode(childBody))
          if (childSchema?.protectButtonVisible) {
            const newItemId = `${sp.id}!${newFolder.id.split('!').pop()}`
            await httpClient.post(`/graph/v1beta1/drives/${sp.id}/items/${newItemId}/protect`)
          }
        } catch { /* ignore if protect fails or schema not found */ }
      }

      // 6. Re-protect parent if we unprotected it
      if (parentImmutable === 'protected' && httpClient) {
        try {
          await httpClient.post(`/graph/v1beta1/drives/${sp.id}/items/${parentItemId}/protect`)
        } catch { /* ignore */ }
      }

      // 7. Update store
      resourcesStore.upsertResource(newFolder)
      showMessage({ title: `${name} erstellt` })
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
    // children can be string[] or { protected: string[], shielded: string[], default: string[] }
    if (Array.isArray(s.children)) return s.children
    const folder = unref(currentFolder)
    const state = (folder as any)?.immutableState || ''
    if (state === 'protected' && (s.children as any).protected) return (s.children as any).protected
    if (state === 'shielded' && (s.children as any).shielded) return (s.children as any).shielded
    return (s.children as any).default || []
  })

  /**
   * Check if the current user can create children.
   * Manager/SpaceAdmin can create even in protected folders (via unprotect/protect).
   */
  const canCreate = computed(() => {
    const folder = unref(currentFolder)
    if (!folder) return false
    const perms = (folder as any).permissions || ''
    // Direct write permission
    if (perms.includes('C') || perms.includes('K')) return true
    // Manager can unprotect → create → protect
    // Managers have 'Z' (manage) permission on protected folders
    const immutableState = (folder as any)?.immutableState || ''
    if ((immutableState === 'protected' || immutableState === 'shielded') && perms.includes('Z')) return true
    return false
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
