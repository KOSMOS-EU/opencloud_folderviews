<template>
  <div class="resource-tree">
    <resource-table
      v-model:selected-ids="selectedIds"
      :resources="visibleResources"
      :view-mode="'resource-table-condensed'"
      :space="space"
      :header-position="headerPosition"
      :sort-fields="[]"
      @file-click="handleFileClick"
      @sort="() => {}"
    >
      <template #image="{ resource }">
        <span
          class="tree-indent-block"
          :style="{ width: depthMap.get(resource.id) * 20 + 'px', display: 'inline-block', flexShrink: 0 }"
        />
        <button
          v-if="resource.type === 'folder'"
          class="tree-btn"
          @click.stop.prevent="toggleExpand(resource)"
        >
          <oc-icon
            :name="isExpanded(resource.id) ? 'arrow-down-s' : 'arrow-right-s'"
            size="small"
          />
        </button>
        <span v-else class="tree-spacer" />
        <resource-icon :resource="resource" size="small" class="mr-1" />
        <oc-spinner v-if="isLoading(resource.id)" size="xsmall" class="ml-1" />
      </template>

      <template #quickActions="{ resource }">
        <slot name="quickActions" :resource="resource" />
      </template>

      <template #contextMenu="{ resource }">
        <slot name="contextMenu" :resource="resource" />
      </template>

      <template #footer>
        <slot name="footer" />
      </template>
    </resource-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Resource, SpaceResource } from '@opencloud-eu/web-client'
import { ResourceTable, ResourceIcon, useClientService } from '@opencloud-eu/web-pkg'
import { useFolderviewSettings } from '../composables/useFolderviewSettings'
import { displayName as buildDisplayName, compareByDisplayName, getFileReference } from '../composables/useFileReference'

const props = defineProps<{
  resources: Resource[]
  space: SpaceResource
  viewMode?: string
  dragDrop?: boolean
  headerPosition?: number
  sortBy?: string
  sortDir?: string
  sortFields?: any[]
  viewSize?: number
}>()

const emit = defineEmits(['fileClick', 'fileDropped', 'itemVisible', 'sort', 'update:selectedIds'])
const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] })
const clientService = useClientService()
const { showAktzInName } = useFolderviewSettings()

const expanded = ref(new Set<string>())
const childrenMap = ref(new Map<string, Resource[]>())
const loadingSet = ref(new Set<string>())
const depthMap = ref(new Map<string, number>())

// Patch missing extraProps for root resources (registerExtraProp runs after initial PROPFIND)
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

function isExpanded(id: string) { return expanded.value.has(id) }
function isLoading(id: string) { return loadingSet.value.has(id) }

async function toggleExpand(resource: Resource) {
  const id = resource.id
  const next = new Set(expanded.value)
  if (next.has(id)) { next.delete(id); expanded.value = next; return }
  next.add(id)
  expanded.value = next

  if (!childrenMap.value.has(id)) {
    loadingSet.value = new Set([...loadingSet.value, id])
    try {
      const { children } = await clientService.webdav.listFiles(props.space, { path: resource.path })
      // Set depth for children = parent depth + 1
      const parentDepth = depthMap.value.get(id) || 0
      const dm = new Map(depthMap.value)
      for (const c of children) { dm.set(c.id, parentDepth + 1) }
      depthMap.value = dm
      childrenMap.value = new Map([...childrenMap.value, [id, children]])
    } catch {
      childrenMap.value = new Map([...childrenMap.value, [id, []]])
    } finally {
      const ls = new Set(loadingSet.value); ls.delete(id); loadingSet.value = ls
    }
  }
}

function handleFileClick(options: any) { emit('fileClick', options) }

const visibleResources = computed(() => {
  const result: Resource[] = []

  function walk(resources: Resource[]) {
    const filtered = resources.filter(r => !r.name?.startsWith('_type_') && !r.name?.startsWith('.'))
    const sorted = [...filtered].sort((a, b) => compareByDisplayName(a, b, showAktzInName.value))
    for (const r of sorted) {
      const display = buildDisplayName(r, showAktzInName.value)
      if (display !== r.name) {
        result.push({ ...r, name: display } as Resource)
      } else {
        result.push(r)
      }
      if (r.type === 'folder' && expanded.value.has(r.id) && childrenMap.value.has(r.id)) {
        walk(childrenMap.value.get(r.id)!)
      }
    }
  }

  // Root resources from props get depth 0
  const dm = new Map(depthMap.value)
  for (const r of props.resources) {
    if (!dm.has(r.id)) dm.set(r.id, 0)
  }
  depthMap.value = dm

  walk(props.resources)
  return result
})

// Reset when folder changes
watch(() => props.resources, () => {
  expanded.value = new Set()
  childrenMap.value = new Map()
  depthMap.value = new Map()
})
</script>

<style scoped>
.tree-btn {
  background: none; border: none; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; margin-right: 2px; border-radius: 4px; flex-shrink: 0;
}
.tree-btn:hover { background: rgba(0,0,0,0.08); }
.tree-spacer { display: inline-block; width: 20px; margin-right: 2px; flex-shrink: 0; }
</style>
