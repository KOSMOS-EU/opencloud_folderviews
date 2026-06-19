<template>
  <div class="element-container-wrap" :class="{ 'element-container-nested': depth > 0 }">
    <!-- Container header OUTSIDE the grid/flex flow -->
    <div v-if="depth > 0 && folderName" class="element-container-header">
      <span class="element-container-label">{{ folderName }}</span>
      <button v-if="divParams" class="element-container-edit" @click.stop="editOpen = !editOpen">
        <oc-icon name="settings-3" size="small" />
      </button>
      <button class="element-container-add" @click.stop="createMd">
        <oc-icon name="add" size="small" />
        <span>+md</span>
      </button>
      <button class="element-container-add" @click.stop="createDiv">
        <oc-icon name="add" size="small" />
        <span>+div</span>
      </button>
    </div>
    <!-- Div params editor -->
    <div v-if="editOpen && divParams" class="element-div-editor" @click.stop>
      <label>Display
        <select v-model="editParams.display">
          <option value="flex">flex</option>
          <option value="grid">grid</option>
        </select>
      </label>
      <label v-if="editParams.display === 'flex'">Direction
        <select v-model="editParams.direction">
          <option value="column">column</option>
          <option value="row">row</option>
        </select>
      </label>
      <label v-if="editParams.display === 'grid'">Columns
        <input type="number" v-model.number="editParams.columns" min="1" max="12" />
      </label>
      <label>Gap
        <input type="text" v-model="editParams.gap" placeholder="8px" />
      </label>
      <label>Padding
        <input type="text" v-model="editParams.padding" placeholder="0" />
      </label>
      <button class="element-div-save" @click="saveDivParams">Speichern</button>
    </div>
    <!-- Add buttons -->
    <div v-if="!loading" class="element-container-actions">
      <button class="element-container-add" @click.stop="createMd">
        <oc-icon name="add" size="small" />
        <span>+md</span>
      </button>
      <button class="element-container-add" @click.stop="createDiv">
        <oc-icon name="add" size="small" />
        <span>+div</span>
      </button>
    </div>
    <!-- Content area with grid/flex layout -->
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
      <element-frame v-else-if="r.type !== 'folder'" :resource="r" :space="space" @deleted="onChildDeleted">
        <element-content :resource="r" :schema="schema" />
      </element-frame>
      <!-- Folder without container schema: skip (navigate via markdown links) -->
    </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, inject, onMounted, watch } from 'vue'
import { type Resource, type SpaceResource } from '@opencloud-eu/web-client'
import { useClientService } from '@opencloud-eu/web-pkg'
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
const clientService = useClientService()
const loading = ref(false)
const children = ref<Resource[]>([])
const containerTypes = ref(new Map<string, { schema: TypedFolderSchema; params: ElementLayout | null }>())
const editOpen = ref(false)
const editParams = reactive<ElementLayout>({})

watch(() => props.divParams, (p) => {
  Object.assign(editParams, { display: 'flex', direction: 'column', gap: '8px', padding: '0', columns: 2, ...p })
}, { immediate: true })

const containerStyle = computed(() => {
  const p = props.divParams || props.schema?.elementLayout || {}
  if (p.columns && (p.display === 'grid' || !p.display)) {
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
    const items = props.depth === 0 && props.resources.length > 0
      ? props.resources
      : await ctx.loadChildren(props.path)

    children.value = items

    const cTypes = new Map<string, { schema: TypedFolderSchema; params: ElementLayout | null }>()
    for (const r of items) {
      if (r.type !== 'folder') continue
      const subChildren = await ctx.loadChildren(r.path)
      const typeFile = subChildren.find(c => c.name?.startsWith('_type_'))
      if (!typeFile) continue

      const typeName = typeFile.name.substring(6)
      const schema = await ctx.getSchema(typeName)
      if (!schema?.isContainer) continue

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

async function saveDivParams() {
  editOpen.value = false
  const typeFilePath = props.path + '/_type_div'
  const params: ElementLayout = { ...editParams }
  if (params.display !== 'grid') delete params.columns
  try {
    await clientService.webdav.putFileContents(props.space, {
      path: typeFilePath,
      content: JSON.stringify(params)
    })
    // Reload
    ctx.clearCache()
    await loadAndAnalyze()
  } catch (e) {
    console.error('[ElementContainer] save div params failed:', e)
  }
}

async function createDiv() {
  const name = prompt('Container-Name:')
  if (!name) return
  const dirPath = props.path + '/' + name.trim()
  const typePath = dirPath + '/_type_div'
  try {
    await clientService.webdav.createFolder(props.space, { path: dirPath })
    await clientService.webdav.putFileContents(props.space, {
      path: typePath,
      content: JSON.stringify({ display: 'flex', direction: 'column', gap: '8px' })
    })
    ctx.clearCache()
    await loadAndAnalyze()
  } catch (e) {
    console.error('[ElementContainer] create div failed:', e)
  }
}

async function createMd() {
  const name = prompt('Dateiname (ohne .md):')
  if (!name) return
  const filePath = props.path + '/' + name.trim() + '.md'
  try {
    await clientService.webdav.putFileContents(props.space, {
      path: filePath,
      content: `# ${name.trim()}\n\n`
    })
    ctx.clearCache()
    await loadAndAnalyze()
  } catch (e) {
    console.error('[ElementContainer] create md failed:', e)
  }
}

function onChildDeleted() {
  ctx.clearCache()
  loadAndAnalyze()
}

onMounted(loadAndAnalyze)
watch(() => props.path, loadAndAnalyze)
</script>

<style scoped>
.element-container-nested {
  border: 1px dashed var(--oc-role-outline-variant, #ccc);
  border-radius: 8px;
  padding: 4px;
}
.element-container-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  font-size: 11px;
  color: var(--oc-role-on-surface-variant, #888);
}
.element-container-label {
  flex: 1;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.element-container-actions {
  display: flex;
  gap: 6px;
  padding: 2px 8px;
}
.element-container-add, .element-container-edit {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 1px solid var(--oc-role-outline-variant, #ccc);
  border-radius: 4px;
  background: none;
  cursor: pointer;
  font-size: 11px;
  color: var(--oc-role-on-surface-variant, #888);
}
.element-container-add:hover, .element-container-edit:hover {
  background: var(--oc-role-surface-variant, #f0f0f0);
}
.element-div-editor {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  margin: 4px 0;
  border: 1px solid var(--oc-role-outline-variant, #ccc);
  border-radius: 6px;
  background: var(--oc-role-surface-variant, #f5f5f5);
  font-size: 12px;
}
.element-div-editor label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: var(--oc-role-on-surface-variant, #666);
}
.element-div-editor select, .element-div-editor input {
  padding: 3px 6px;
  border: 1px solid var(--oc-role-outline-variant, #ccc);
  border-radius: 4px;
  font-size: 12px;
  width: 80px;
}
.element-div-save {
  align-self: flex-end;
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  background: var(--oc-role-primary, #1a73e8);
  color: #fff;
  cursor: pointer;
  font-size: 12px;
}
.element-div-save:hover { opacity: 0.9; }
.element-container-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: #888;
  font-size: 13px;
}
</style>
