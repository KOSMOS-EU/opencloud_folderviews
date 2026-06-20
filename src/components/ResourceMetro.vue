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
        <span class="metro-tile-label">{{ displayLabel(resource) }}</span>
        <span v-if="getProp(resource, 'oc:oy.note')" class="metro-tile-note">{{ getProp(resource, 'oc:oy.note') }}</span>
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
        <span class="metro-tile-label">{{ displayLabel(r) }}</span>
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
import { TypedFolderSchema } from '../composables/types'

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

const leafFolder = ref<Resource | null>(null)
const leafSchemaCache = ref(new Map<string, boolean>())
const childTypeCache = ref(new Map<string, string>())
const taskCountCache = ref(new Map<string, number>())
const leafDetectGeneration = ref(0)

// --- Read metadata directly from PROPFIND extraProps (no async needed) ---

function getProp(resource: Resource, key: string): string {
  return ((resource as any).extraProps?.[key] as string) || ''
}

function getColor(resource: Resource): string {
  return getProp(resource, 'oc:oy.color')
}

function displayLabel(resource: Resource): string {
  // name is already prefixed in sortedResources
  return resource.name || ''
}

function tileStyle(resource: Resource): Record<string, string> {
  const color = getColor(resource)
  if (!color) return {}
  return { backgroundColor: color, color: '#fff' }
}

function getTaskCount(resource: Resource): number {
  return taskCountCache.value.get(resource.id) || 0
}

// --- Leaf detection: use current folder schema to know child types ---

// Which child types are leaf? Loaded once from current folder's schema.
const leafTypes = ref(new Set<string>())
const leafDetectionDone = ref(false)

async function detectLeafTypes(resources: Resource[]) {
  // Find current folder type from _type_* file
  const typeFile = resources.find(r => r.name?.startsWith('_type_'))
  if (!typeFile) { leafDetectionDone.value = true; return }
  const currentType = typeFile.name!.substring(6)

  // Load current folder's schema to get allowed children types
  try {
    const { body } = await clientService.webdav.getFileContents(props.space, {
      path: `.views/${currentType}.json`
    }) as any
    const schema = JSON.parse(typeof body === 'string' ? body : new TextDecoder().decode(body)) as TypedFolderSchema

    // Get all possible child types
    let childTypes: string[] = []
    if (Array.isArray(schema.children)) {
      childTypes = schema.children
    } else if (schema.children && typeof schema.children === 'object') {
      const c = schema.children as any
      childTypes = [...new Set([...(c.protected || []), ...(c.shielded || []), ...(c.default || [])])]
    }

    // Load each child type's schema (parallel) to check isLeaf
    const newLeafTypes = new Set<string>()
    await Promise.all(childTypes.map(async (ct) => {
      if (leafSchemaCache.value.has(ct)) {
        if (leafSchemaCache.value.get(ct)) newLeafTypes.add(ct)
        return
      }
      try {
        const { body: b } = await clientService.webdav.getFileContents(props.space, {
          path: `.views/${ct}.json`
        }) as any
        const s = JSON.parse(typeof b === 'string' ? b : new TextDecoder().decode(b)) as TypedFolderSchema
        leafSchemaCache.value.set(ct, !!s.isLeaf)
        if (s.isLeaf) newLeafTypes.add(ct)
      } catch {
        leafSchemaCache.value.set(ct, false)
      }
    }))

    leafTypes.value = newLeafTypes

    // Now detect each child folder's type + task count (parallel)
    const folders = resources.filter(r => r.type === 'folder' && !r.name?.startsWith('_type_'))
    await Promise.all(folders.map(async (r) => {
      if (childTypeCache.value.has(r.id)) return
      try {
        const rPath = r.path || (resourcesStore.currentFolder?.path?.replace(/\/?$/, '/') + r.name)
        const { children } = await clientService.webdav.listFiles(props.space, { path: rPath })
        const tf = children.find(c => c.name?.startsWith('_type_'))
        childTypeCache.value.set(r.id, tf ? tf.name!.substring(6) : '')
        const tc = children.filter(c => c.name?.endsWith('.task')).length
        if (tc > 0) taskCountCache.value.set(r.id, tc)
      } catch { /* ignore */ }
    }))
  } catch { /* no schema = no leaf types */ }

  leafDetectionDone.value = true
  leafDetectGeneration.value++
}

function isLeafResource(resource: Resource): boolean {
  const childType = childTypeCache.value.get(resource.id)
  if (!childType) return false
  return leafTypes.value.has(childType)
}

function openLeaf(resource: Resource) {
  if (!resource.path) {
    (resource as any).path = (resourcesStore.currentFolder?.path?.replace(/\/?$/, '/') || '/') + resource.name
  }
  leafFolder.value = resource
}

// --- Kick off leaf detection once when resources change ---

watch(() => props.resources, (res) => {
  leafDetectionDone.value = false
  detectLeafTypes(res)
}, { immediate: true })

// --- Sorted resources: prefix name with fileReference, sort numerically ---

const sortedResources = computed(() => {
  return props.resources
    .filter(r => !r.name?.startsWith('_type_'))
    .map(r => {
      const ref = getProp(r, 'oc:oy.fileReference')
      if (!ref) return r
      return Object.assign(Object.create(Object.getPrototypeOf(r)), r, {
        name: `${ref} ${r.name}`
      })
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }))
})

const nonLeafResources = computed(() => {
  void leafDetectGeneration.value
  return sortedResources.value.filter(r => !isLeafResource(r))
})

const leafResources = computed(() => {
  void leafDetectGeneration.value
  return sortedResources.value.filter(r => r.type === 'folder' && isLeafResource(r))
})
</script>

<style>
.metro-view .oc-tile-card {
  outline-color: var(--oc-role-outline-variant) !important;
  background: var(--oc-role-outline-variant) !important;
}
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
.metro-view .metro-tile-label,
.metro-leaf-tile .metro-tile-label {
  font-weight: 700;
  font-size: 14px;
  text-align: center;
  word-break: break-word;
  line-height: 1.4;
}
.metro-view .metro-tile-badge,
.metro-leaf-tile .metro-tile-badge {
  font-size: 10px;
  opacity: 0.75;
  margin-top: 6px;
  padding: 1px 6px;
  background: rgba(255,255,255,0.2);
  border-radius: 8px;
}
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
.metro-view .resource-name-wrapper { display: none !important; }
.metro-view .oc-card-body > .p-2 > .flex { justify-content: flex-end !important; }

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
