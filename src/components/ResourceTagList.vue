<template>
  <div class="resource-tag-list">
    <!-- Toolbar: search + tag filter -->
    <div class="tag-list-toolbar">
      <div class="tag-search">
        <oc-icon name="search" size="small" class="tag-search-icon" />
        <input
          v-model="searchText"
          type="text"
          class="tag-search-input"
          :placeholder="$gettext('Search by name or tag...')"
        />
        <oc-button v-if="searchText" appearance="raw" size="small" @click="searchText = ''">
          <oc-icon name="close" size="small" />
        </oc-button>
      </div>
      <div class="tag-chips">
        <span
          v-for="tag in allTags"
          :key="tag.name"
          class="tag-chip"
          :class="{ active: activeTagFilters.has(tag.name) }"
          @click="toggleTagFilter(tag.name)"
        >
          <oc-icon name="price-tag-3" size="xsmall" />
          {{ tag.name }}
          <span class="tag-count">{{ tag.count }}</span>
        </span>
      </div>
    </div>

    <!-- Results table -->
    <resource-table
      v-model:selected-ids="selectedIds"
      :resources="filteredResources"
      :view-mode="'resource-table-condensed'"
      :space="space"
      :header-position="headerPosition"
      :sort-fields="[]"
      @file-click="handleFileClick"
      @sort="() => {}"
    >
      <template #image="{ resource }">
        <span
          class="tag-indent"
          :style="{ width: (depthMap.get(resource.id) || 0) * 20 + 'px' }"
        />
        <button
          v-if="resource.type === 'folder'"
          class="tree-btn"
          @click.stop.prevent="toggleExpand(resource)"
        >
          {{ isExpanded(resource.id) ? '−' : '+' }}
        </button>
        <span v-else class="tree-spacer" />
        <resource-icon :resource="resource" size="small" class="mr-1" />
      </template>

      <template #quickActions="{ resource }">
        <div class="tag-cell">
          <span
            v-for="tag in (resource.tags || [])"
            :key="tag"
            class="tag-chip-small"
            :class="{ active: activeTagFilters.has(tag) }"
            @click.stop="toggleTagFilter(tag)"
          >
            {{ tag }}
          </span>
        </div>
      </template>

      <template #contextMenu="{ resource }">
        <slot name="contextMenu" :resource="resource" />
      </template>

      <template #footer>
        <slot name="footer" />
      </template>
    </resource-table>

    <div v-if="!filteredResources.length && (searchText || activeTagFilters.size)" class="tag-empty">
      {{ $gettext('No results for this filter.') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Resource, SpaceResource } from '@opencloud-eu/web-client'
import { ResourceTable, ResourceIcon, useClientService, useResourcesStore } from '@opencloud-eu/web-pkg'
import { useGettext } from 'vue3-gettext'

const { $gettext } = useGettext()

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
const resourcesStore = useResourcesStore()

const searchText = ref('')
const activeTagFilters = ref(new Set<string>())
const expanded = ref(new Set<string>())
const childrenMap = ref(new Map<string, Resource[]>())
const depthMap = ref(new Map<string, number>())
const loadingSet = ref(new Set<string>())

// Collect all tags from visible resources with counts
const allTags = computed(() => {
  const tagCounts = new Map<string, number>()
  function countTags(resources: Resource[]) {
    for (const r of resources) {
      for (const tag of r.tags || []) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      }
      if (expanded.value.has(r.id) && childrenMap.value.has(r.id)) {
        countTags(childrenMap.value.get(r.id)!)
      }
    }
  }
  countTags(props.resources)
  return Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

function toggleTagFilter(tag: string) {
  const s = new Set(activeTagFilters.value)
  if (s.has(tag)) s.delete(tag); else s.add(tag)
  activeTagFilters.value = s
}

// Filter + expand logic
function matchesFilter(r: Resource): boolean {
  const search = searchText.value.toLowerCase().trim()
  const tags = activeTagFilters.value

  // Tag filter: resource must have ALL active tags
  if (tags.size > 0) {
    const rTags = new Set(r.tags || [])
    for (const t of tags) {
      if (!rTags.has(t)) return false
    }
  }

  // Text search: name or tags
  if (search) {
    const nameMatch = (r.name || '').toLowerCase().includes(search)
    const tagMatch = (r.tags || []).some(t => t.toLowerCase().includes(search))
    if (!nameMatch && !tagMatch) return false
  }

  return true
}

const filteredResources = computed(() => {
  const result: Resource[] = []
  const hasFilter = searchText.value.trim() || activeTagFilters.value.size > 0

  function walk(resources: Resource[], depth: number) {
    const filtered = resources.filter(r => !r.name?.startsWith('_type_') && !r.name?.startsWith('.'))
    const sorted = [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }))

    for (const r of sorted) {
      const dm = depthMap.value
      if (!dm.has(r.id)) { dm.set(r.id, depth) }

      if (!hasFilter || matchesFilter(r)) {
        result.push(r)
      }

      // Show children if expanded
      if (r.type === 'folder' && expanded.value.has(r.id) && childrenMap.value.has(r.id)) {
        walk(childrenMap.value.get(r.id)!, depth + 1)
      }
    }
  }

  walk(props.resources, 0)
  return result
})

function isExpanded(id: string) { return expanded.value.has(id) }

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

// Auto-expand folders that match tag filter
watch([activeTagFilters, searchText], async () => {
  if (!activeTagFilters.value.size && !searchText.value.trim()) return
  for (const r of props.resources) {
    if (r.type === 'folder' && matchesFilter(r) && !expanded.value.has(r.id)) {
      await toggleExpand(r)
    }
  }
})

// Reset on folder change
watch(() => props.resources, () => {
  expanded.value = new Set()
  childrenMap.value = new Map()
  depthMap.value = new Map()
})
</script>

<style scoped>
.resource-tag-list {
  overflow-x: auto;
}

.tag-list-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 16px;
  align-items: center;
  border-bottom: 1px solid var(--oc-role-outline-variant, #ddd);
}

.tag-search {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--oc-role-surface-container, #f5f5f5);
  border-radius: 20px;
  padding: 6px 12px;
  flex: 1;
  min-width: 180px;
  max-width: 360px;
}

.tag-search-icon { opacity: 0.5; flex-shrink: 0; }

.tag-search-input {
  border: none; background: transparent; outline: none;
  font-size: 14px; flex: 1; min-width: 0;
  color: inherit;
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: var(--oc-role-surface-container, #f0f0f0);
  color: var(--oc-role-on-surface-variant, #555);
  transition: all 0.15s;
  user-select: none;
}

.tag-chip:hover { background: var(--oc-role-surface-container-high, #e0e0e0); }

.tag-chip.active {
  background: var(--oc-role-primary, #1976d2);
  color: #fff;
}

.tag-count {
  font-size: 10px;
  opacity: 0.7;
  margin-left: 2px;
}

.tag-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-chip-small {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  cursor: pointer;
  background: var(--oc-role-surface-container, #f0f0f0);
  color: var(--oc-role-on-surface-variant, #555);
  transition: all 0.15s;
}

.tag-chip-small:hover { background: var(--oc-role-surface-container-high, #e0e0e0); }
.tag-chip-small.active { background: var(--oc-role-primary, #1976d2); color: #fff; }

.tag-indent {
  display: inline-block;
  flex-shrink: 0;
}

.tree-btn {
  background: none; border: 1px solid rgba(0,0,0,0.15); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; margin-right: 4px; border-radius: 4px; flex-shrink: 0;
  font-size: 16px; font-weight: 600; line-height: 1; color: inherit; opacity: 0.6;
}
.tree-btn:hover { background: rgba(0,0,0,0.08); opacity: 1; }
.tree-spacer { display: inline-block; width: 24px; margin-right: 4px; flex-shrink: 0; }

.tag-empty {
  padding: 40px;
  text-align: center;
  color: var(--oc-role-on-surface-variant, #999);
}

@media (max-width: 639px) {
  .tag-list-toolbar { padding: 8px 12px; }
  .tag-search { max-width: 100%; }
}
</style>
