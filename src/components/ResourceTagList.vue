<template>
  <div class="resource-tag-list">
    <!-- Toolbar: search + two tag selects -->
    <div class="tag-list-toolbar">
      <div v-if="!isSpaceListing" class="tag-search">
        <oc-icon name="search" size="small" class="tag-search-icon" />
        <input
          v-model="searchText"
          type="text"
          class="tag-search-input"
          :placeholder="$gettext('Name...')"
          @input="onSearchInput"
        />
        <oc-button v-if="searchText" appearance="raw" size="small" @click="searchText = ''; onSearchInput()">
          <oc-icon name="close" size="small" />
        </oc-button>
      </div>
      <oc-select
        v-model="primaryTags"
        class="tag-filter-select"
        :label="$gettext('Primärtag')"
        :multiple="true"
        :options="availableTagOptions"
        @update:model-value="onTagChanged"
      >
        <template #selected-option-container="{ option, deselect }">
          <oc-tag class="ml-1" :rounded="true" size="small">
            <oc-icon name="price-tag-3" class="mr-1" size="small" />
            <span class="truncate">{{ option.label }}</span>
            <oc-button appearance="raw" class="vs__deselect mx-0" @mousedown.stop.prevent @click="deselect(option)">
              <oc-icon name="close" size="small" />
            </oc-button>
          </oc-tag>
        </template>
        <template #option="{ label }">
          <oc-tag class="ml-1" :rounded="true" size="small">
            <oc-icon name="price-tag-3" size="small" /><span class="truncate">{{ label }}</span>
          </oc-tag>
        </template>
        <template #no-options><span class="text-sm" v-text="$gettext('No tags available')" /></template>
      </oc-select>
      <oc-select
        v-model="secondaryTags"
        class="tag-filter-select"
        :label="$gettext('Sekundärtag')"
        :multiple="true"
        :options="availableTagOptions"
        @update:model-value="onTagChanged"
      >
        <template #selected-option-container="{ option, deselect }">
          <oc-tag class="ml-1" :rounded="true" size="small">
            <oc-icon name="price-tag-3" class="mr-1" size="small" />
            <span class="truncate">{{ option.label }}</span>
            <oc-button appearance="raw" class="vs__deselect mx-0" @mousedown.stop.prevent @click="deselect(option)">
              <oc-icon name="close" size="small" />
            </oc-button>
          </oc-tag>
        </template>
        <template #option="{ label }">
          <oc-tag class="ml-1" :rounded="true" size="small">
            <oc-icon name="price-tag-3" size="small" /><span class="truncate">{{ label }}</span>
          </oc-tag>
        </template>
        <template #no-options><span class="text-sm" v-text="$gettext('No tags available')" /></template>
      </oc-select>
    </div>

    <!-- Results table -->
    <resource-table
      v-model:selected-ids="selectedIds"
      :resources="filteredResources"
      :fields-displayed="hasActiveFilter ? fileFields : undefined"
      :view-mode="'resource-table-condensed'"
      :space="space"
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

    <div v-if="searching" class="tag-searching">
      <oc-spinner size="small" /> {{ $gettext('Searching...') }}
    </div>
    <div v-else-if="!filteredResources.length && activeTagFilters.size" class="tag-empty">
      {{ $gettext('No results for this filter.') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Resource, SpaceResource } from '@opencloud-eu/web-client'
import { ResourceTable, ResourceIcon, useClientService, useResourcesStore } from '@opencloud-eu/web-pkg'
import { DavProperties } from '@opencloud-eu/web-client/webdav'
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

// Detect if we're on the space listing (Projects view) vs inside a space
const isSpaceListing = computed(() => {
  return props.resources.length > 0 && props.resources[0]?.type === 'space'
})
const expanded = ref(new Set<string>())
const childrenMap = ref(new Map<string, Resource[]>())
const depthMap = ref(new Map<string, number>())
const loadingSet = ref(new Set<string>())
const searchResults = ref<Resource[]>([])
const searching = ref(false)

// Load all known tags from server (like TagsSelect sidebar)
const knownTags = ref<string[]>([])
async function loadKnownTags() {
  try {
    const tags = await clientService.graphAuthenticated.tags.listTags({})
    knownTags.value = tags.sort()
  } catch (e) {
    console.warn('[TagList] failed to load tags:', e)
  }
}

// Count tags in currently visible resources (for badge counts)
const tagCounts = computed(() => {
  const counts = new Map<string, number>()
  function countTags(resources: Resource[]) {
    for (const r of resources) {
      for (const tag of r.tags || []) {
        counts.set(tag, (counts.get(tag) || 0) + 1)
      }
      if (expanded.value.has(r.id) && childrenMap.value.has(r.id)) {
        countTags(childrenMap.value.get(r.id)!)
      }
    }
  }
  countTags(props.resources)
  return counts
})

// All tags: known from server, with local counts where available
const allTags = computed(() => {
  const tags = new Set([...knownTags.value])
  // Also add tags from current resources that server might not know yet
  for (const [tag] of tagCounts.value) { tags.add(tag) }
  return Array.from(tags)
    .map(name => ({ name, count: tagCounts.value.get(name) || 0 }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const primaryTags = ref<{ label: string }[]>([])
const secondaryTags = ref<{ label: string }[]>([])
const availableTagOptions = computed(() =>
  allTags.value.map(t => ({ label: t.name }))
)

function onTagChanged() {
  activeTagFilters.value = new Set([
    ...primaryTags.value.map(t => t.label),
    ...secondaryTags.value.map(t => t.label)
  ])
  doServerSearch()
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => doServerSearch(), 400)
}

function toggleTagFilter(tag: string) {
  // Add to primary tags from inline chip click
  const has = primaryTags.value.some(t => t.label === tag)
  if (has) {
    primaryTags.value = primaryTags.value.filter(t => t.label !== tag)
  } else {
    primaryTags.value = [...primaryTags.value, { label: tag }]
  }
  onTagChanged()
}

// Server-side search via WebDAV search API
async function doServerSearch() {
  const primary = primaryTags.value.map(t => t.label)
  const secondary = secondaryTags.value.map(t => t.label)
  const term = searchText.value.trim()

  if (!primary.length && !secondary.length && !term) {
    searchResults.value = []
    return
  }

  // Build KQL: name:"*term*" AND OR(primary) AND OR(secondary)
  const parts: string[] = []
  if (term) {
    parts.push(`name:"*${term}*"`)
  }
  if (primary.length) {
    parts.push(`tag:(${primary.map(t => `"${t}"`).join(' OR ')})`)
  }
  if (secondary.length) {
    parts.push(`tag:(${secondary.map(t => `"${t}"`).join(' OR ')})`)
  }
  const query = parts.join(' AND ')

  searching.value = true
  try {
    console.log('[TagList] search:', query)
    const { resources } = await clientService.webdav.search(query, {
      searchLimit: 200,
      davProperties: DavProperties.Default
    })
    searchResults.value = resources
    console.log('[TagList] found:', resources.length)
  } catch (e) {
    console.warn('[TagList] search failed:', e)
    searchResults.value = []
  } finally {
    searching.value = false
  }
}


const hasActiveFilter = computed(() => primaryTags.value.length > 0 || secondaryTags.value.length > 0 || searchText.value.trim().length > 0)

// When search active: force file columns (override space listing columns from parent)
const fileFields = ['image', 'name', 'size', 'tags', 'mdate']

const filteredResources = computed(() => {
  // Tag filter active → show server results (even if empty)
  if (hasActiveFilter.value) {
    return searchResults.value
      .filter(r => !r.name?.startsWith('_type_') && !r.name?.startsWith('.'))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }))
  }

  // No active tag filter → show local resources with tree expand
  const result: Resource[] = []

  function walk(resources: Resource[], depth: number) {
    const filtered = resources.filter(r => !r.name?.startsWith('_type_') && !r.name?.startsWith('.'))
    const sorted = [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }))

    for (const r of sorted) {
      if (!depthMap.value.has(r.id)) depthMap.value.set(r.id, depth)
      result.push(r)
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


// Reset on folder change
watch(() => props.resources, () => {
  expanded.value = new Set()
  childrenMap.value = new Map()
  depthMap.value = new Map()
})

onMounted(loadKnownTags)
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
  min-width: 120px;
  max-width: 220px;
}

.tag-search-icon { opacity: 0.5; flex-shrink: 0; }

.tag-search-input {
  border: none; background: transparent; outline: none;
  font-size: 14px; flex: 1; min-width: 0;
  color: inherit;
}

.tag-filter-select {
  min-width: 180px;
  max-width: 300px;
  flex: 1;
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

.tag-searching {
  display: flex; align-items: center; gap: 8px;
  padding: 40px; justify-content: center;
  color: var(--oc-role-on-surface-variant, #666);
}

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
