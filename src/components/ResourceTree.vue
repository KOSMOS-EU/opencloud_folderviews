<template>
  <div class="resource-tree">
    <resource-table
      :selected-ids="[]"
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
          :style="{ width: calcDepth(resource) * 20 + 'px', display: 'inline-block', flexShrink: 0 }"
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
import { ref, computed, watch } from 'vue'
import { Resource, SpaceResource } from '@opencloud-eu/web-client'
import { ResourceTable, ResourceIcon, useClientService } from '@opencloud-eu/web-pkg'
import { useFolderviewSettings } from '../composables/useFolderviewSettings'
import { displayName as buildDisplayName } from '../composables/useFileReference'

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
// Clear parent's initial selection — tree handles its own selection
selectedIds.value = []
const clientService = useClientService()
const { showAktzInName } = useFolderviewSettings()

const expanded = ref(new Set<string>())
const childrenMap = ref(new Map<string, Resource[]>())
const loadingSet = ref(new Set<string>())
const rootResources = ref<Resource[]>([])
const rootLoaded = ref(false)
function isExpanded(id: string) { return expanded.value.has(id) }
function isLoading(id: string) { return loadingSet.value.has(id) }

// Calculate depth from path segments relative to root resources
function calcDepth(resource: Resource): number {
  if (!resource.path) return 0
  const rootPaths = props.resources.filter(r => !r.name?.startsWith('_type_')).map(r => r.path)
  const segments = resource.path.split('/').filter(Boolean)
  // Find the shortest root path segment count
  let minRootSegments = Infinity
  for (const rp of rootPaths) {
    const cnt = rp.split('/').filter(Boolean).length
    if (cnt < minRootSegments) minRootSegments = cnt
  }
  if (minRootSegments === Infinity) return 0
  return segments.length - minRootSegments
}

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
      childrenMap.value = new Map([...childrenMap.value, [id, children]])
      // Don't upsertResource — tree manages its own children via childrenMap
    } catch {
      childrenMap.value = new Map([...childrenMap.value, [id, []]])
    } finally {
      const ls = new Set(loadingSet.value); ls.delete(id); loadingSet.value = ls
    }
  }
}

function handleFileClick(options: any) { emit('fileClick', options) }

// Load root resources ourselves to avoid parent's sort
async function loadRootResources() {
  if (rootLoaded.value || !props.space) return
  rootLoaded.value = true
  try {
    const { children } = await clientService.webdav.listFiles(props.space, { path: '' })
    rootResources.value = children
    // Don't upsertResource — tree manages its own children via childrenMap
  } catch {
    rootResources.value = props.resources
  }
}

const visibleResources = computed(() => {
  const source = rootResources.value.length > 0 ? rootResources.value : props.resources
  const result: Resource[] = []

  function walk(resources: Resource[]) {
    const filtered = resources.filter(r => !r.name?.startsWith('_type_') && !r.name?.startsWith('.'))
    for (const r of filtered) {
      // Override display name based on user setting
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

  walk(source.filter(r => !r.name?.startsWith('_type_') && !r.name?.startsWith('.')))
  return result
})

watch(() => props.space?.id, () => {
  expanded.value = new Set()
  childrenMap.value = new Map()
  rootLoaded.value = false
  rootResources.value = []
  loadRootResources()
}, { immediate: true })
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
