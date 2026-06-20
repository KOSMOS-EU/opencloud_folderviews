<template>
  <div>
  <typed-folder-toolbar :space="space" />
  <resource-tiles
    v-bind="$attrs"
    v-model:selected-ids="selectedIds"
    :resources="filteredResources"
    :space="space"
    :view-mode="viewMode"
    :sort-by="sortBy"
    :sort-dir="sortDir"
    :sort-fields="sortFields"
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
        <span class="metro-tile-label">{{ buildDisplayName(resource, showAktzInName) }}</span>
        <span v-if="getNote(resource)" class="metro-tile-note">{{ getNote(resource) }}</span>
      </div>
    </template>
    <template #contextMenu="{ resource }">
      <slot name="contextMenu" :resource="resource" />
    </template>
  </resource-tiles>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Resource, SpaceResource } from '@opencloud-eu/web-client'
import TypedFolderToolbar from './TypedFolderToolbar.vue'
import { ResourceTiles, useClientService } from '@opencloud-eu/web-pkg'
import { useFolderviewSettings } from '../composables/useFolderviewSettings'
import { displayName as buildDisplayName, getFileReference } from '../composables/useFileReference'

const { showAktzInName } = useFolderviewSettings()
const clientService = useClientService()

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

const patchedRefs = ref(new Map<string, string>())

function getColor(resource: Resource): string {
  return (resource as any).extraProps?.['oc:oy.color'] || ''
}

function getNote(resource: Resource): string {
  return (resource as any).extraProps?.['oc:oy.note'] || ''
}

function tileStyle(resource: Resource): Record<string, string> {
  const color = getColor(resource)
  if (!color) return {}
  return {
    backgroundColor: color,
    color: '#fff'
  }
}

async function patchFileReferences(resources: Resource[]) {
  const missing = resources.filter(r => r.type === 'folder' && !patchedRefs.value.has(r.id))
  if (!missing.length) return
  const httpClient = (clientService as any).httpAuthenticated
  if (!httpClient) return
  const spaceId = props.space.id
  const patch = new Map(patchedRefs.value)
  for (const r of missing) {
    try {
      const itemId = `${spaceId}!${r.id.split('!').pop()}`
      const { data } = await httpClient.get(`/graph/v1beta1/drives/${spaceId}/items/${itemId}/metadata`)
      if (!(r as any).extraProps) (r as any).extraProps = {}
      if (data?.['oy.fileReference']) {
        ;(r as any).extraProps['oc:oy.fileReference'] = data['oy.fileReference']
      }
      if (data?.['oy.color']) {
        ;(r as any).extraProps['oc:oy.color'] = data['oy.color']
      }
      if (data?.['oy.note']) {
        ;(r as any).extraProps['oc:oy.note'] = data['oy.note']
      }
      patch.set(r.id, 'done')
    } catch { /* ignore */ }
  }
  patchedRefs.value = patch
}

watch(() => props.resources, (res) => patchFileReferences(res), { immediate: true })

const filteredResources = computed(() => {
  // Force reactivity on patchedRefs
  void patchedRefs.value
  return props.resources.filter(r => !r.name?.startsWith('_type_'))
})
</script>

<style>
/* Metro: tile fill color, name centered in preview area, bottom bar hidden */
.metro-view .oc-tile-card {
  outline-color: var(--oc-role-outline-variant) !important;
  background: var(--oc-role-outline-variant) !important;
}
/* Tile content container */
.metro-view .metro-tile-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 8px;
  border-radius: 4px;
}
/* Center the label in the preview area */
.metro-view .metro-tile-label {
  font-weight: 700;
  font-size: 14px;
  text-align: center;
  word-break: break-word;
  line-height: 1.4;
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
</style>
