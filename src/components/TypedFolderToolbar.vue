<template>
  <div v-if="isTyped" class="typed-folder-header typed-folder-active" :class="{ 'typed-folder-header-mobile': isMobile }">
    <!-- Typed header: icon + name + label + count + action buttons -->
    <div class="typed-header-row">
      <oc-icon
        v-if="schema"
        :name="schema.icon || 'folder'"
        :size="isMobile ? 'large' : 'xxlarge'"
        variation="passive"
      />
      <oc-icon v-else name="error-warning" :size="isMobile ? 'large' : 'xxlarge'" variation="danger" />
      <div class="typed-header-text">
        <h2 class="typed-header-title">
          <span v-if="currentFolderFileRef" class="typed-header-ref">{{ currentFolderFileRef }}</span>{{ currentFolder?.name || '' }}
        </h2>
        <p v-if="schema" class="typed-header-meta">
          {{ schema.label }} · {{ folderCount }} Einträge
        </p>
      </div>
    </div>
    <!-- Action buttons -->
    <div class="typed-toolbar">
    <oc-button
      v-for="child in childButtons"
      v-if="canCreate"
      :key="child.type"
      appearance="outline"
      size="small"
      @click="openCreateDialog(child.type, child.label)"
    >
      <oc-icon name="add" size="small" />
      <span v-if="!isMobile">{{ child.label }}</span>
    </oc-button>
    <oc-button
      v-if="schema?.protectButtonVisible && canManageImmutable && immutableState === 'protected'"
      appearance="outline"
      size="small"
      @click="doUnprotect"
    >
      <oc-icon name="lock-unlock" size="small" />
      <span v-if="!isMobile">Schutz aufheben</span>
    </oc-button>
    <oc-button
      v-if="schema?.protectButtonVisible && canManageImmutable && immutableState !== 'protected'"
      appearance="outline"
      size="small"
      @click="doProtect"
    >
      <oc-icon name="lock" size="small" />
      <span v-if="!isMobile">Schützen</span>
    </oc-button>

    <create-dialog
      v-if="dialogOpen"
      :title="dialogTitle"
      :show-color="dialogShowColor"
      :show-note="dialogShowNote"
      :parent-az="dialogParentAz"
      :initial-az-rest="dialogInitialAzRest"
      @cancel="dialogOpen = false"
      @confirm="onDialogConfirm"
    />

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, unref } from 'vue'
import { type SpaceResource } from '@opencloud-eu/web-client'
import { useResourcesStore, useClientService, useSpacesStore } from '@opencloud-eu/web-pkg'
import { useTypedFolderActions } from '../composables/useTypedFolderActions'
import { useTypedFolderSchema, getCachedSchema } from '../composables/useTypedFolderSchema'
import { useAppModeStore } from '../composables/useAppModeStore'
import CreateDialog from './CreateDialog.vue'

const props = defineProps<{
  space?: SpaceResource
}>()

const resourcesStore = useResourcesStore()
const spacesStore = useSpacesStore()
const clientService = useClientService()
const windowWidth = ref(window.innerWidth)
window.addEventListener('resize', () => { windowWidth.value = window.innerWidth })
const isMobile = computed(() => windowWidth.value < 640)
const currentFolder = computed(() => resourcesStore.currentFolder)

// Space: use prop if given, otherwise derive from currentFolder
const resolvedSpace = computed(() => {
  if (props.space) return props.space
  const folder = unref(currentFolder)
  if (!folder) return undefined
  return spacesStore.spaces.find(s => s.id === folder.storageId) as SpaceResource | undefined
})

const currentType = computed(() => {
  // Prefer oy.ftype xattr on current folder
  const folder = unref(currentFolder) as any
  const ftype = folder?.extraProps?.['om:oy.ftype']
  if (ftype) return ftype
  // Fallback: _type_* file in resources
  const resources = resourcesStore.resources || []
  const typeFile = resources.find(r => r.name?.startsWith('_type_'))
  return typeFile ? typeFile.name.substring(6) : undefined
})

const isTyped = computed(() => !!unref(currentType))
const appModeStore = useAppModeStore()

const spaceRef = computed(() => unref(resolvedSpace))
const { schema } = useTypedFolderSchema(spaceRef, currentType)
const { createTypedChild, computeNextFileReference, allowedChildren, canCreate } = useTypedFolderActions(
  spaceRef, currentFolder, schema
)

const currentFolderFileRef = computed(() => {
  const folder = unref(currentFolder) as any
  const ref = folder?.extraProps?.['om:oy.fileReference']
  return ref ? String(ref) : ''
})

const folderCount = computed(() => {
  const resources = resourcesStore.resources || []
  return resources.filter(r => r.type === 'folder' && !r.name?.startsWith('_type_')).length
})

const immutableState = computed(() => (unref(currentFolder) as any)?.immutableState || '')

const canManageImmutable = computed(() => {
  const perms = (unref(currentFolder) as any)?.permissions || ''
  return perms.includes('Z')
})

async function doProtect() {
  const folder = unref(currentFolder)
  const sp = unref(resolvedSpace)
  if (!folder || !sp) return
  const httpClient = (clientService as any).httpAuthenticated
  if (!httpClient) return
  const itemId = `${sp.id}!${folder.id.split('!').pop()}`
  try {
    await httpClient.post(`/graph/v1beta1/drives/${sp.id}/items/${itemId}/protect`)
    window.location.reload()
  } catch (e) {
    console.error('[TypedToolbar] protect failed:', e)
  }
}

async function doUnprotect() {
  const folder = unref(currentFolder)
  const sp = unref(resolvedSpace)
  if (!folder || !sp) return
  const httpClient = (clientService as any).httpAuthenticated
  if (!httpClient) return
  const itemId = `${sp.id}!${folder.id.split('!').pop()}`
  try {
    await httpClient.delete(`/graph/v1beta1/drives/${sp.id}/items/${itemId}/protect`)
    window.location.reload()
  } catch (e) {
    console.error('[TypedToolbar] unprotect failed:', e)
  }
}

const typeLabels: Record<string, string> = {
  aktenplan: 'Neue Aktenstruktur',
  akte: 'Neue Akte',
  vorgang: 'Neuer Vorgang',
  register: 'Neues Register',
  lernplan: 'Neuer Lernbereich',
  thema: 'Neues Thema'
}

// At space root, don't offer leaf types (thema) — only structural types
const isSpaceRoot = computed(() => {
  const folder = unref(currentFolder)
  const p = folder?.path || ''
  return !p || p === '/'
})

// Check if any child folder is a leaf type (via oy.ftype + cached schema)
const hasLeafChild = computed(() => {
  const s = unref(schema)
  if (!s?.leafStrict) return false
  const sp = unref(resolvedSpace)
  if (!sp) return false
  const resources = resourcesStore.resources || []
  return resources.some(r => {
    if (r.type !== 'folder') return false
    const ftype = (r as any).extraProps?.['om:oy.ftype']
    if (!ftype) return false
    const childSchema = getCachedSchema(sp.id, ftype)
    return !!childSchema?.isLeaf
  })
})

const childButtons = computed(() => {
  const children = unref(allowedChildren)
  let filtered = unref(isSpaceRoot)
    ? children.filter(t => t === unref(currentType))
    : children

  // leafStrict: once a leaf child exists, only offer leaf types
  if (unref(hasLeafChild)) {
    const sp = unref(resolvedSpace)
    if (sp) {
      filtered = filtered.filter(t => {
        const cs = getCachedSchema(sp.id, t)
        return !!cs?.isLeaf
      })
    }
  }

  return filtered.map(childType => ({
    type: childType,
    label: typeLabels[childType] || `Neu: ${childType}`
  }))
})

// --- Create dialog state ---
const dialogOpen = ref(false)
const dialogTitle = ref('')
const dialogShowColor = ref(false)
const dialogShowNote = ref(false)
const dialogChildType = ref('')
const dialogParentAz = ref('')
const dialogInitialAzRest = ref('')

async function openCreateDialog(childType: string, label: string) {
  const s = unref(schema)
  dialogChildType.value = childType
  dialogTitle.value = label
  dialogShowColor.value = !!s?.metadata?.['oy.color']
  dialogShowNote.value = !!s?.metadata?.['oy.note']

  // Compute parent AZ and suggested next rest for the dialog
  const parentRef = currentFolderFileRef.value
  dialogParentAz.value = parentRef
  if (parentRef) {
    const nextFull = await computeNextFileReference(childType)
    dialogInitialAzRest.value = nextFull.startsWith(parentRef) ? nextFull.slice(parentRef.length) : nextFull
  } else {
    dialogInitialAzRest.value = ''
  }

  dialogOpen.value = true
}

function onDialogConfirm(data: { name: string; color?: string; note?: string; fileReference?: string }) {
  dialogOpen.value = false
  const extraMeta: Record<string, string> = {}
  if (data.color) extraMeta['oy.color'] = data.color
  if (data.note) extraMeta['oy.note'] = data.note
  createTypedChild(
    dialogChildType.value,
    data.name,
    Object.keys(extraMeta).length > 0 ? extraMeta : undefined,
    data.fileReference
  )
}
</script>

<style scoped>
.typed-folder-header {
  padding: 16px;
}

.typed-folder-header-mobile {
  padding: 8px 12px;
}

.typed-header-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.typed-folder-header-mobile .typed-header-row {
  gap: 10px;
}

.typed-header-text {
  flex: 1;
  min-width: 0;
}

.typed-header-title {
  margin: 0;
  font-size: 20px;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
}

.typed-folder-header-mobile .typed-header-title {
  font-size: 16px;
}

.typed-header-ref {
  opacity: 0.6;
  margin-right: 8px;
}

.typed-header-meta {
  margin: 4px 0 0;
  opacity: 0.6;
  font-size: 14px;
}

.typed-folder-header-mobile .typed-header-meta {
  font-size: 12px;
}

.typed-toolbar {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}
</style>
