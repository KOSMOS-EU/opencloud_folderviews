<template>
  <div v-if="isTyped" class="typed-folder-header">
    <!-- Typed header: icon + name + label + count -->
    <div class="typed-header-row">
      <oc-icon
        v-if="schema"
        :name="schema.icon || 'folder'"
        size="xxlarge"
        variation="passive"
      />
      <oc-icon v-else name="error-warning" size="xxlarge" variation="danger" />
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
      <span>{{ child.label }}</span>
    </oc-button>
    <oc-button
      v-if="schema?.protectButtonVisible && canManageImmutable && immutableState === 'protected'"
      appearance="outline"
      size="small"
      @click="doUnprotect"
    >
      <oc-icon name="lock-unlock" size="small" />
      <span>Schutz aufheben</span>
    </oc-button>
    <oc-button
      v-if="schema?.protectButtonVisible && canManageImmutable && immutableState !== 'protected'"
      appearance="outline"
      size="small"
      @click="doProtect"
    >
      <oc-icon name="lock" size="small" />
      <span>Schützen</span>
    </oc-button>

    <create-dialog
      v-if="dialogOpen"
      :title="dialogTitle"
      :show-color="dialogShowColor"
      :show-note="dialogShowNote"
      @cancel="dialogOpen = false"
      @confirm="onDialogConfirm"
    />

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, unref } from 'vue'
import { type SpaceResource } from '@opencloud-eu/web-client'
import { useResourcesStore, useClientService } from '@opencloud-eu/web-pkg'
import { useTypedFolderActions } from '../composables/useTypedFolderActions'
import { useTypedFolderSchema } from '../composables/useTypedFolderSchema'
import CreateDialog from './CreateDialog.vue'

const props = defineProps<{
  space: SpaceResource
}>()

const resourcesStore = useResourcesStore()
const clientService = useClientService()
const currentFolder = computed(() => resourcesStore.currentFolder)

const currentType = computed(() => {
  const resources = resourcesStore.resources || []
  const typeFile = resources.find(r => r.name?.startsWith('_type_'))
  return typeFile ? typeFile.name.substring(6) : undefined
})

const isTyped = computed(() => !!unref(currentType))

const spaceRef = computed(() => props.space)
const { schema } = useTypedFolderSchema(spaceRef, currentType)
const { createTypedChild, allowedChildren, canCreate } = useTypedFolderActions(
  spaceRef, currentFolder, schema
)

const currentFolderFileRef = computed(() => {
  const folder = unref(currentFolder) as any
  return folder?.extraProps?.['oc:oy.fileReference'] || ''
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
  const sp = props.space
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
  const sp = props.space
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

const childButtons = computed(() => {
  const children = unref(allowedChildren)
  const filtered = unref(isSpaceRoot)
    ? children.filter(t => t === unref(currentType))
    : children
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

function openCreateDialog(childType: string, label: string) {
  const s = unref(schema)
  dialogChildType.value = childType
  dialogTitle.value = label
  dialogShowColor.value = !!s?.metadata?.['oy.color']
  dialogShowNote.value = !!s?.metadata?.['oy.note']
  dialogOpen.value = true
}

function onDialogConfirm(data: { name: string; color?: string; note?: string }) {
  dialogOpen.value = false
  const extraMeta: Record<string, string> = {}
  if (data.color) extraMeta['oy.color'] = data.color
  if (data.note) extraMeta['oy.note'] = data.note
  createTypedChild(
    dialogChildType.value,
    data.name,
    Object.keys(extraMeta).length > 0 ? extraMeta : undefined
  )
}
</script>

<style scoped>
.typed-folder-header {
  padding: 16px;
}

.typed-header-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.typed-header-text {
  flex: 1;
}

.typed-header-title {
  margin: 0;
  font-size: 20px;
  word-break: break-all;
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

.typed-toolbar {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
</style>
