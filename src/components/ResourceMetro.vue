<template>
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
      <span class="metro-tile-label">{{ buildDisplayName(resource, showAktzInName) }}</span>
    </template>
    <template #contextMenu="{ resource }">
      <slot name="contextMenu" :resource="resource" />
    </template>
  </resource-tiles>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Resource, SpaceResource } from '@opencloud-eu/web-client'
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

async function patchFileReferences(resources: Resource[]) {
  if (!showAktzInName.value) return
  const missing = resources.filter(r => r.type === 'folder' && !getFileReference(r) && !patchedRefs.value.has(r.id))
  if (!missing.length) return
  const httpClient = (clientService as any).httpAuthenticated
  if (!httpClient) return
  const spaceId = props.space.id
  const patch = new Map(patchedRefs.value)
  for (const r of missing) {
    try {
      const itemId = `${spaceId}!${r.id.split('!').pop()}`
      const { data } = await httpClient.get(`/graph/v1beta1/drives/${spaceId}/items/${itemId}/metadata`)
      const ref = data?.['oy.fileReference']
      if (ref) {
        patch.set(r.id, ref)
        if (!(r as any).extraProps) (r as any).extraProps = {}
        ;(r as any).extraProps['oc:oy.fileReference'] = ref
      }
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
/* Center the label in the preview area */
.metro-view .metro-tile-label {
  font-weight: 700;
  font-size: 14px;
  text-align: center;
  word-break: break-word;
  line-height: 1.4;
  padding: 8px;
}
/* Hide name in bottom bar, push icons to the right */
.metro-view .resource-name-wrapper { display: none !important; }
.metro-view .oc-card-body > .p-2 > .flex { justify-content: flex-end !important; }
</style>
