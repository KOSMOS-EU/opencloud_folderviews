<template>
  <div>
  <!-- Learn Editor overlay -->
  <learn-editor
    v-if="leafFolder"
    :space="space"
    :folder="leafFolder"
    @close="leafFolder = null"
  />

  <!-- Normal Metro view -->
  <template v-else>
  <typed-folder-toolbar :space="space" />
  <resource-tiles
    v-bind="$attrs"
    v-model:selected-ids="selectedIds"
    :resources="nonLeafResources"
    :space="space"
    :view-mode="viewMode"
    :sort-fields="[]"
    :header-position="headerPosition"
    :view-size="viewSize"
    :drag-drop="dragDrop"
    class="metro-view"
    @file-click="$emit('fileClick', $event)"
    @file-dropped="$emit('fileDropped', $event)"
    @item-visible="$emit('itemVisible', $event)"
    @sort="$emit('sort', $event)"
  >
    <template #image="{ resource }">
      <div
        class="metro-tile-content"
        :style="tileStyle(resource)"
      >
        <span class="metro-tile-label">{{ metaDisplayName(resource) }}</span>
        <span v-if="getNote(resource)" class="metro-tile-note">{{ getNote(resource) }}</span>
      </div>
    </template>
    <template #contextMenu="{ resource }">
      <slot name="contextMenu" :resource="resource" />
    </template>
  </resource-tiles>

  <!-- Leaf tiles (rendered separately with click → LearnEditor) -->
  <div v-if="leafResources.length" class="metro-leaf-grid">
    <div
      v-for="r in leafResources"
      :key="r.id"
      class="metro-leaf-tile"
      @click="openLeaf(r)"
    >
      <div class="metro-tile-content" :style="tileStyle(r)">
        <oc-icon name="book-open" size="large" class="metro-leaf-icon" />
        <span class="metro-tile-label">{{ metaDisplayName(r) }}</span>
        <span v-if="getTaskCount(r)" class="metro-tile-badge">{{ getTaskCount(r) }} Aufgaben</span>
      </div>
    </div>
  </div>
  </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Resource, SpaceResource } from '@opencloud-eu/web-client'
import TypedFolderToolbar from './TypedFolderToolbar.vue'
import LearnEditor from './LearnEditor.vue'
import { ResourceTiles, useClientService, useResourcesStore } from '@opencloud-eu/web-pkg'
import { useFolderviewSettings } from '../composables/useFolderviewSettings'
import { displayName as buildDisplayName, getFileReference } from '../composables/useFileReference'
import { TypedFolderSchema } from '../composables/types'

const { showAktzInName } = useFolderviewSettings()
const clientService = useClientService()
const resourcesStore = useResourcesStore()

const props = defineProps<{
  resources: Resource[]
  space: SpaceResource
  viewMode?: string
  sortBy?: string
  sortDir?: string
  dragDrop?: boolean
  headerPosition?: number
  sortFields?: any[]
  viewSize?: number
}>()

const emit = defineEmits(['fileClick', 'fileDropped', 'itemVisible', 'sort', 'update:selectedIds'])
const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] })

const patchedRefs = ref(new Map<string, string>())
const leafFolder = ref<Resource | null>(null)
const leafSchemaCache = ref(new Map<string, boolean>())
const childTypeCache = ref(new Map<string, string>())
const taskCountCache = ref(new Map<string, number>())
const leafDetectGeneration = ref(0)
// Reactive metadata (extraProps mutations aren't tracked by Vue)
const metaCache = ref(new Map<string, Record<string, string>>())

function getMeta(resource: Resource, key: string): string {
  return metaCache.value.get(resource.id)?.[key] || ''
}

function getColor(resource: Resource): string {
  return getMeta(resource, 'oy.color')
}

function getNote(resource: Resource): string {
  return getMeta(resource, 'oy.note')
}

function tileStyle(resource: Resource): Record<string, string> {
  const color = getColor(resource)
  if (!color) return {}
  return { backgroundColor: color, color: '#fff' }
}

function getTaskCount(resource: Resource): number {
  return taskCountCache.value.get(resource.id) || 0
}

function metaDisplayName(resource: Resource): string {
  // name is already prefixed with fileRef in patchedNameResources
  return resource.name || ''
}

async function checkChildType(resource: Resource) {
  if (childTypeCache.value.has(resource.id)) return
  try {
    const rPath = resource.path || (resourcesStore.currentFolder?.path?.replace(/\/?$/, '/') + resource.name)
    const { children } = await clientService.webdav.listFiles(props.space, { path: rPath })
    const typeFile = children.find(r => r.name?.startsWith('_type_'))
    const childType = typeFile ? typeFile.name!.substring(6) : ''
    childTypeCache.value.set(resource.id, childType)

    const taskCount = children.filter(r => r.name?.endsWith('.task')).length
    if (taskCount > 0) {
      taskCountCache.value.set(resource.id, taskCount)
    }

    if (childType && !leafSchemaCache.value.has(childType)) {
      try {
        const { body } = await clientService.webdav.getFileContents(props.space, {
          path: `.views/${childType}.json`
        }) as any
        const schema = JSON.parse(typeof body === 'string' ? body : new TextDecoder().decode(body)) as TypedFolderSchema
        leafSchemaCache.value.set(childType, !!schema.isLeaf)
      } catch {
        leafSchemaCache.value.set(childType, false)
      }
    }

    leafDetectGeneration.value++
  } catch { /* ignore */ }
}

function isLeafResource(resource: Resource): boolean {
  const childType = childTypeCache.value.get(resource.id)
  if (!childType) return false
  return leafSchemaCache.value.get(childType) || false
}

function openLeaf(resource: Resource) {
  if (!resource.path) {
    (resource as any).path = (resourcesStore.currentFolder?.path?.replace(/\/?$/, '/') || '/') + resource.name
  }
  leafFolder.value = resource
}

async function patchFileReferences(resources: Resource[]) {
  const missing = resources.filter(r => r.type === 'folder' && !patchedRefs.value.has(r.id))
  if (!missing.length) return
  const httpClient = (clientService as any).httpAuthenticated
  if (!httpClient) return
  const spaceId = props.space.id

  // Parallel metadata fetch for all folders at once
  await Promise.all(missing.map(async (r) => {
    try {
      const itemId = `${spaceId}!${r.id.split('!').pop()}`
      const { data } = await httpClient.get(`/graph/v1beta1/drives/${spaceId}/items/${itemId}/metadata`)
      const meta: Record<string, string> = {}
      if (data?.['oy.fileReference']) meta['oy.fileReference'] = data['oy.fileReference']
      if (data?.['oy.color']) meta['oy.color'] = data['oy.color']
      if (data?.['oy.note']) meta['oy.note'] = data['oy.note']
      metaCache.value.set(r.id, meta)
      patchedRefs.value.set(r.id, 'done')
    } catch { /* ignore */ }
  }))

  // Single reactive update after all fetches complete
  patchedRefs.value = new Map(patchedRefs.value)
  metaCache.value = new Map(metaCache.value)

  // Leaf detection in background (non-blocking)
  for (const r of missing) {
    checkChildType(r)
  }
}

watch(() => props.resources, (res) => patchFileReferences(res), { immediate: true })

// Resources with fileRef prefix in name, sorted by that prefixed name
const patchedNameResources = computed(() => {
  void metaCache.value
  void patchedRefs.value
  return props.resources
    .filter(r => !r.name?.startsWith('_type_'))
    .map(r => {
      const ref = getMeta(r, 'oy.fileReference')
      if (!ref) return r
      return Object.assign(Object.create(Object.getPrototypeOf(r)), r, {
        name: `${ref} ${r.name}`
      })
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }))
})

const nonLeafResources = computed(() => {
  void leafDetectGeneration.value
  return patchedNameResources.value.filter(r => !isLeafResource(r))
})

const leafResources = computed(() => {
  void leafDetectGeneration.value
  return patchedNameResources.value.filter(r => r.type === 'folder' && isLeafResource(r))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }))
})
</script>

<style>
/* Metro: tile fill color, name centered in preview area, bottom bar hidden */
.metro-view .oc-tile-card {
  outline-color: var(--oc-role-outline-variant) !important;
  background: var(--oc-role-outline-variant) !important;
}
/* Tile content container */
.metro-view .metro-tile-content,
.metro-leaf-tile .metro-tile-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 12px 8px;
  border-radius: 8px;
  background: var(--oc-role-outline-variant, #ddd);
}
/* Center the label in the preview area */
.metro-view .metro-tile-label,
.metro-leaf-tile .metro-tile-label {
  font-weight: 700;
  font-size: 14px;
  text-align: center;
  word-break: break-word;
  line-height: 1.4;
}
/* Task count badge */
.metro-view .metro-tile-badge,
.metro-leaf-tile .metro-tile-badge {
  font-size: 10px;
  opacity: 0.75;
  margin-top: 6px;
  padding: 1px 6px;
  background: rgba(255,255,255,0.2);
  border-radius: 8px;
}
/* Note/description under tile title */
.metro-view .metro-tile-note {
  font-size: 11px;
  opacity: 0.85;
  text-align: center;
  line-height: 1.3;
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
/* Hide name in bottom bar, push icons to the right */
.metro-view .resource-name-wrapper { display: none !important; }
.metro-view .oc-card-body > .p-2 > .flex { justify-content: flex-end !important; }

/* Leaf tiles grid */
.metro-leaf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  padding: 12px 16px;
}
.metro-leaf-tile {
  cursor: pointer;
  transition: transform 0.1s;
  min-height: 140px;
}
.metro-leaf-tile:hover {
  transform: scale(1.03);
}
.metro-leaf-icon {
  margin-bottom: 4px;
  opacity: 0.8;
}
</style>
