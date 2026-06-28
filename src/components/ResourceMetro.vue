<template>
  <div>
  <!-- Leaf app overlay (resolved from extension registry) -->
  <component
    v-if="leafFolder && leafExtension"
    :is="leafExtension.content"
    :space="space"
    :folder="leafFolder"
    :resource="leafEntryResource"
    @close="leafFolder = null"
  />
  <div v-else-if="leafFolder" class="leaf-fallback">
    <oc-button appearance="outline" size="small" @click="leafFolder = null">Zurück</oc-button>
    <p>Keine registrierte App für "{{ leafApp }}"</p>
  </div>

  <!-- ViewTypes tiles for _type_views folders -->
  <view-types-tiles
    v-else-if="isViewsFolder"
    :resources="props.resources"
    :space="space"
    @file-click="$emit('fileClick', $event)"
  />

  <!-- Normal Metro view -->
  <template v-else>
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

  <!-- Leaf tiles — own grid with OC tile sizing -->
  <div v-if="leafResources.length" class="metro-leaf-grid oc-tiles">
    <div
      v-for="r in leafResources"
      :key="r.id"
      class="oc-tile oc-tile-card metro-leaf-tile"
      @click="openLeaf(r)"
    >
      <div class="metro-tile-content" :style="tileStyle(r)">
        <oc-icon :name="getLeafIcon(r)" size="xlarge" class="metro-leaf-icon" />
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
import ViewTypesTiles from './ViewTypesTiles.vue'
import { ResourceTiles, useResourcesStore, useExtensionRegistry } from '@opencloud-eu/web-pkg'
import { useFolderviewSettings } from '../composables/useFolderviewSettings'

const resourcesStore = useResourcesStore()
const extensionRegistry = useExtensionRegistry()
const { showAktzInName } = useFolderviewSettings()

const isSpaceRoot = computed(() => {
  const p = resourcesStore.currentFolder?.path || ''
  return !p || p === '/'
})

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

const leafApp = computed(() => {
  if (!leafFolder.value) return ''
  return getProp(leafFolder.value, 'oc:oy.app')
})

// Find registered leaf-app extension matching oy.app value
const leafExtension = computed(() => {
  if (!leafApp.value) return null
  const exts = extensionRegistry.requestExtensions({
    id: 'app.folderviews.leaf-apps',
    extensionType: 'customComponent',
    multiple: true
  })
  return exts.find((e: any) => e.appName === leafApp.value) || null
})

// Entry resource for apps that need a file reference (e.g. info.mdm)
const leafEntryResource = computed(() => {
  if (!leafFolder.value) return null
  const folder = leafFolder.value
  const appName = leafApp.value
  // Convention: app entry file based on app name
  const entryFiles: Record<string, string> = { 'mdm-editor': 'info.mdm' }
  const entryFile = entryFiles[appName] || ''
  if (!entryFile) return folder
  const path = (folder.path || folder.name) + '/' + entryFile
  return { ...folder, path, name: entryFile, type: 'file', isFolder: false }
})

// Detect _type_views folder → show ViewTypesTiles instead of normal metro
const isViewsFolder = computed(() => {
  const allResources = resourcesStore.resources || []
  return allResources.some(r => r.name === '_type_views')
})

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

function getLeafIcon(resource: Resource): string {
  const app = getProp(resource, 'oc:oy.app')
  const exts = extensionRegistry.requestExtensions({
    id: 'app.folderviews.leaf-apps',
    extensionType: 'customComponent',
    multiple: true
  })
  const ext = exts.find((e: any) => e.appName === app)
  return (ext as any)?.appIcon || 'folder-open'
}

function openLeaf(resource: Resource) {
  if (!resource.path) {
    (resource as any).path = (resourcesStore.currentFolder?.path?.replace(/\/?$/, '/') || '/') + resource.name
  }

  // Open leaf folder as overlay — the template selects the component based on oy.app
  leafFolder.value = resource
}

function handleLeafClick(event: any) {
  const resource = event?.resources?.[0]
  if (resource) openLeaf(resource)
}

const nonLeafResources = computed(() => sortedResources.value.filter(r => !isLeaf(r)))
const leafResources = computed(() => sortedResources.value.filter(r => r.type === 'folder' && isLeaf(r)))

// Prefix name with fileReference (if enabled in settings), sort numerically
const sortedResources = computed(() => {
  return props.resources
    .filter(r => !r.name?.startsWith('_type_'))
    .map(r => {
      if (!showAktzInName.value) return r
      const ref = getProp(r, 'oc:oy.fileReference')
      if (!ref) return r
      return Object.assign(Object.create(Object.getPrototypeOf(r)), r, {
        name: `${ref} ${r.name}`
      })
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }))
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
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px 16px;
}
.metro-leaf-tile {
  cursor: pointer;
  transition: transform 0.1s;
  outline: 1px solid var(--oc-role-outline-variant, #ddd);
  border-radius: var(--oc-radius-md, 8px);
  overflow: hidden;
  flex: 0 0 auto;
  width: var(--oc-size-tiles-actual, var(--oc-size-tiles-default, 250px));
  aspect-ratio: 16/11;
}
@media (max-width: 639px) {
  .metro-leaf-grid { gap: 10px; padding: 8px 12px; }
  .metro-leaf-tile { width: calc(50% - 5px); }
}
@media (max-width: 380px) {
  .metro-leaf-tile { width: 100%; }
}
.metro-leaf-tile:hover { transform: scale(1.02); outline-color: var(--oc-role-primary, #1976d2); }
.metro-leaf-icon { margin-bottom: 8px; opacity: 0.8; }
</style>
