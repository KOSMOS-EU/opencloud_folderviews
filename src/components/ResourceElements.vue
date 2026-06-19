<template>
  <div class="resource-elements">
    <div v-if="!ready" class="resource-elements-loading">
      <oc-spinner size="small" /> Laden...
    </div>
    <element-container
      v-else
      :resources="resources"
      :path="currentPath"
      :depth="0"
      :schema="rootSchema"
      :div-params="rootDivParams"
      :space="space"
      @context-menu="onContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, watch } from 'vue'
import { type Resource, type SpaceResource } from '@opencloud-eu/web-client'
import { useResourcesStore } from '@opencloud-eu/web-pkg'
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
const spaceRef = computed(() => props.space)
const ctx = useElementRenderer(spaceRef)
provide(ELEMENT_RENDERER_KEY, ctx)

const currentPath = computed(() => resourcesStore.currentFolder?.path || '')

const ready = ref(false)
const rootSchema = ref<TypedFolderSchema | null>(null)
const rootDivParams = ref<ElementLayout | null>(null)

async function detectRootType() {
  ready.value = false
  // Use resourcesStore.resources (unfiltered) because GenericSpace strips _type_* from displayResources
  const allResources = resourcesStore.resources || props.resources
  const typeFile = allResources.find(r => r.name?.startsWith('_type_'))
  if (!typeFile) {
    rootSchema.value = null
    rootDivParams.value = null
    ready.value = true
    return
  }

  const typeName = typeFile.name.substring(6)
  rootSchema.value = await ctx.getSchema(typeName)

  if (typeName === 'div' && typeFile.path) {
    rootDivParams.value = await ctx.loadTypeParams(typeFile.path)
  } else {
    rootDivParams.value = rootSchema.value?.elementLayout || null
  }
  ready.value = true
}

function onContextMenu(resource: Resource, event: MouseEvent) {
  emit('fileClick', { resources: [resource], event })
}

watch(() => props.resources, () => {
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
</style>
