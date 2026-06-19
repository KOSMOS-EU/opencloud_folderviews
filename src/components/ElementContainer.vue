<template>
  <div class="element-container" :style="containerStyle">
    <div v-if="loading" class="element-container-loading">
      <oc-spinner size="small" /> Laden...
    </div>
    <template v-else v-for="r in visibleChildren" :key="r.id">
      <!-- Folder with container schema: recurse -->
      <element-container
        v-if="r.type === 'folder' && containerTypes.has(r.id)"
        :resources="[]"
        :path="r.path"
        :depth="depth + 1"
        :schema="containerTypes.get(r.id)!.schema"
        :div-params="containerTypes.get(r.id)!.params"
        :space="space"
        :folder-name="r.name"
      />
      <!-- File: render in frame -->
      <element-frame v-else-if="r.type !== 'folder'" :resource="r" :space="space">
        <element-content :resource="r" :schema="schema" />
      </element-frame>
      <!-- Folder without container schema: render as folder card -->
      <element-frame v-else :resource="r" :space="space">
        <div class="element-folder-card">
          <oc-icon name="folder" size="medium" />
          <span>{{ r.name }}</span>
        </div>
      </element-frame>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, watch } from 'vue'
import { type Resource, type SpaceResource } from '@opencloud-eu/web-client'
import { type TypedFolderSchema, type ElementLayout } from '../composables/types'
import { ELEMENT_RENDERER_KEY } from '../composables/useElementRenderer'
import ElementFrame from './ElementFrame.vue'
import ElementContent from './ElementContent.vue'

const props = defineProps<{
  resources: Resource[]
  path: string
  depth: number
  schema: TypedFolderSchema | null
  divParams?: ElementLayout | null
  space: SpaceResource
  folderName?: string
}>()


const ctx = inject(ELEMENT_RENDERER_KEY)!
const loading = ref(false)
const children = ref<Resource[]>([])
const containerTypes = ref(new Map<string, { schema: TypedFolderSchema; params: ElementLayout | null }>())

const containerStyle = computed(() => {
  const p = props.divParams || props.schema?.elementLayout || {}
  if (p.columns) {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${p.columns}, 1fr)`,
      gap: p.gap || '8px',
      padding: p.padding || '0'
    }
  }
  return {
    display: p.display || 'flex',
    flexDirection: p.direction || 'column',
    flexWrap: p.wrap || 'nowrap',
    gap: p.gap || '8px',
    alignItems: p.align || 'stretch',
    padding: p.padding || '0'
  }
})

const visibleChildren = computed(() => {
  return children.value.filter(r => !r.name?.startsWith('_type_') && !r.name?.startsWith('.'))
})

async function loadAndAnalyze() {
  loading.value = true
  try {
    // Depth 0: use provided resources; deeper: load via listFiles
    const items = props.depth === 0 && props.resources.length > 0
      ? props.resources
      : await ctx.loadChildren(props.path)

    children.value = items

    // Analyze folder children for container types
    const cTypes = new Map<string, { schema: TypedFolderSchema; params: ElementLayout | null }>()
    for (const r of items) {
      if (r.type !== 'folder') continue
      // Check if this folder has a _type_ marker by loading its children
      const subChildren = await ctx.loadChildren(r.path)
      const typeFile = subChildren.find(c => c.name?.startsWith('_type_'))
      if (!typeFile) continue

      const typeName = typeFile.name.substring(6)
      const schema = await ctx.getSchema(typeName)
      if (!schema?.isContainer) continue

      // Load div params from the _type_ file content
      const params = typeName === 'div'
        ? await ctx.loadTypeParams(typeFile.path)
        : schema.elementLayout || null

      cTypes.set(r.id, { schema, params })
    }
    containerTypes.value = cTypes
  } catch (e) {
    console.error('[ElementContainer] load error:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadAndAnalyze)
watch(() => props.path, loadAndAnalyze)
</script>

<style scoped>
.element-container-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: #888;
  font-size: 13px;
}
.element-folder-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  font-size: 13px;
}
</style>
