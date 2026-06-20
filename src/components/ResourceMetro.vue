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
      <div class="metro-tile-content" :style="tileStyle(resource)">
        <span class="metro-tile-label">{{ resource.name }}</span>
        <span v-if="getProp(resource, 'oc:oy.note')" class="metro-tile-note">{{ getProp(resource, 'oc:oy.note') }}</span>
      </div>
    </template>
    <template #contextMenu="{ resource }">
      <slot name="contextMenu" :resource="resource" />
    </template>
  </resource-tiles>

  <!-- Leaf tiles (oy.app set → click opens LearnEditor) -->
  <div v-if="leafResources.length" class="metro-leaf-grid">
    <div
      v-for="r in leafResources"
      :key="r.id"
      class="metro-leaf-tile"
      @click="openLeaf(r)"
    >
      <div class="metro-tile-content" :style="tileStyle(r)">
        <oc-icon name="book-open" size="large" class="metro-leaf-icon" />
        <span class="metro-tile-label">{{ r.name }}</span>
      </div>
    </div>
  </div>
  </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Resource, SpaceResource } from '@opencloud-eu/web-client'
import TypedFolderToolbar from './TypedFolderToolbar.vue'
import LearnEditor from './LearnEditor.vue'
import { ResourceTiles, useResourcesStore } from '@opencloud-eu/web-pkg'

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

defineEmits(['fileClick', 'fileDropped', 'itemVisible', 'sort', 'update:selectedIds'])
const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] })

const leafFolder = ref<Resource | null>(null)

function getProp(resource: Resource, key: string): string {
  return ((resource as any).extraProps?.[key] as string) || ''
}

function tileStyle(resource: Resource): Record<string, string> {
  const color = getProp(resource, 'oc:oy.color')
  if (!color) return {}
  return { backgroundColor: color, color: '#fff' }
}

function isLeaf(resource: Resource): boolean {
  return !!getProp(resource, 'oc:oy.app')
}

function openLeaf(resource: Resource) {
  if (!resource.path) {
    (resource as any).path = (resourcesStore.currentFolder?.path?.replace(/\/?$/, '/') || '/') + resource.name
  }
  leafFolder.value = resource
}

// Prefix name with fileReference, sort numerically
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

const nonLeafResources = computed(() => sortedResources.value.filter(r => !isLeaf(r)))
const leafResources = computed(() => sortedResources.value.filter(r => r.type === 'folder' && isLeaf(r)))
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
.metro-leaf-tile:hover { transform: scale(1.03); }
.metro-leaf-icon { margin-bottom: 4px; opacity: 0.8; }
</style>
