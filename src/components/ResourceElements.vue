<template>
  <div class="resource-elements">
    <div v-if="!ready" class="resource-elements-loading">
      <oc-spinner size="small" /> Laden...
    </div>
    <!-- Typed container: toolbar + recursive element rendering -->
    <template v-else-if="rootSchema">
      <element-container
        :resources="resources"
        :path="currentPath"
        :depth="0"
        :schema="rootSchema"
        :div-params="rootDivParams"
        :space="space"
      />
    </template>
    <!-- Untyped: space overview or plain folder → clickable cards -->
    <div v-else class="element-cards">
      <div
        v-for="r in filteredResources"
        :key="r.id"
        class="element-card"
        @click="navigateTo(r)"
      >
        <oc-icon :name="r.isFolder ? 'folder' : 'file'" size="large" />
        <span class="element-card-name">{{ r.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, watch } from 'vue'
import { type Resource, type SpaceResource } from '@opencloud-eu/web-client'
import { useResourcesStore, useRouter, createFileRouteOptions, createLocationSpaces } from '@opencloud-eu/web-pkg'
import { useElementRenderer, ELEMENT_RENDERER_KEY } from '../composables/useElementRenderer'
import { type TypedFolderSchema, type ElementLayout } from '../composables/types'
import ElementContainer from './ElementContainer.vue'

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

const resourcesStore = useResourcesStore()
const isSpaceRoot = computed(() => {
  const p = resourcesStore.currentFolder?.path || ''
  return !p || p === '/'
})
const router = useRouter()
const spaceRef = computed(() => props.space)
const ctx = useElementRenderer(spaceRef)
provide(ELEMENT_RENDERER_KEY, ctx)

const currentPath = computed(() => resourcesStore.currentFolder?.path || '')

const filteredResources = computed(() => {
  return props.resources.filter(r => !r.name?.startsWith('_type_') && !r.name?.startsWith('.'))
})

function navigateTo(resource: Resource) {
  // Check if resource is a space (has getDriveAliasAndItem)
  if ((resource as any).getDriveAliasAndItem) {
    const space = resource as SpaceResource
    const routeOpts = createFileRouteOptions(space, { path: '', fileId: space.fileId })
    router.push(createLocationSpaces('files-spaces-generic', routeOpts))
  } else {
    const current = router.currentRoute.value
    const targetPath = current.path.replace(/\/$/, '') + '/' + resource.name
    const query = { ...current.query }
    delete query.fileId
    delete query.scrollTo
    delete query.page
    router.push({ path: targetPath, query })
  }
}

const ready = ref(false)
const rootSchema = ref<TypedFolderSchema | null>(null)
const rootDivParams = ref<ElementLayout | null>(null)

async function detectRootType() {
  ready.value = false
  // Prefer oy.ftype xattr, fallback to _type_* file
  const folder = resourcesStore.currentFolder as any
  const ftype = folder?.extraProps?.['om:oy.ftype']
  const allResources = resourcesStore.resources || props.resources
  const typeFile = allResources.find(r => r.name?.startsWith('_type_'))
  const typeName = ftype || (typeFile ? typeFile.name.substring(6) : null)
  if (!typeName) {
    rootSchema.value = null
    rootDivParams.value = null
    ready.value = true
    return
  }
  rootSchema.value = await ctx.getSchema(typeName)

  if (typeName === 'div' && typeFile.path) {
    rootDivParams.value = await ctx.loadTypeParams(typeFile.path)
  } else {
    rootDivParams.value = rootSchema.value?.elementLayout || null
  }
  ready.value = true
}

let lastResourceIds = ''
watch(() => props.resources, (newRes) => {
  // Only re-detect if resource list actually changed (avoid infinite loops)
  const ids = newRes.map(r => r.id).sort().join(',')
  if (ids === lastResourceIds) return
  lastResourceIds = ids
  ctx.clearCache()
  detectRootType()
}, { immediate: true })
</script>

<style scoped>
.resource-elements {
  padding: 8px;
  min-height: 200px;
}
.resource-elements-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: #888;
}
.element-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  padding: 8px;
}
.element-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 12px;
  border: 1px solid var(--oc-role-outline-variant, #e0e0e0);
  border-radius: 12px;
  background: var(--oc-role-surface, #fff);
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
}
.element-card:hover {
  background: var(--oc-role-surface-variant, #f5f5f5);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.element-card-name {
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  word-break: break-word;
  color: var(--oc-role-on-surface, #333);
}
</style>
