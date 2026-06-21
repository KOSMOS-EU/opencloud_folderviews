<template>
  <div class="viewtypes-tiles">
    <div
      v-for="vt in viewTypes"
      :key="vt.filename"
      class="viewtype-tile"
      @click="openFile(vt)"
    >
      <oc-icon :name="vt.icon || 'file-settings'" size="xxlarge" variation="passive" />
      <div class="viewtype-tile-label">{{ vt.label || vt.name }}</div>
      <div class="viewtype-tile-name">{{ vt.name }}</div>
      <div v-if="vt.childCount !== undefined" class="viewtype-tile-meta">
        {{ $ngettext('%{count} Untertyp', '%{count} Untertypen', vt.childCount, { count: vt.childCount.toString() }) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useClientService, useRouter, useAppsStore } from '@opencloud-eu/web-pkg'

const { $ngettext } = useGettext()

interface ViewTypeInfo {
  filename: string
  name: string
  label: string
  icon: string
  childCount?: number
  resource: any
}

const props = defineProps<{
  resources: any[]
  space: any
}>()

const emit = defineEmits<{ fileClick: [{ resources: any[] }] }>()

const clientService = useClientService()
const router = useRouter()
const viewTypes = ref<ViewTypeInfo[]>([])

async function loadViewTypes() {
  const types: ViewTypeInfo[] = []
  for (const r of props.resources) {
    if (!r.name?.endsWith('.viewtype')) continue
    const name = r.name.replace('.viewtype', '')
    let label = name
    let icon = 'file-settings'
    let childCount: number | undefined
    try {
      const { body } = await clientService.webdav.getFileContents(props.space, { path: r.path }) as any
      const schema = JSON.parse(typeof body === 'string' ? body : new TextDecoder().decode(body))
      if (schema.label) label = schema.label
      if (schema.icon) icon = schema.icon
      if (Array.isArray(schema.children)) childCount = schema.children.length
      else if (schema.children && typeof schema.children === 'object') {
        const all = new Set<string>()
        for (const arr of Object.values(schema.children) as string[][]) {
          for (const c of arr) all.add(c)
        }
        childCount = all.size
      }
    } catch { /* use defaults */ }
    types.push({ filename: r.name, name, label, icon, childCount, resource: r })
  }
  viewTypes.value = types
}

function openFile(vt: ViewTypeInfo) {
  const resource = vt.resource
  router.push({
    name: 'folderviews-viewtype-editor',
    params: {
      driveAliasAndItem: props.space.getDriveAliasAndItem(resource)
    },
    query: {
      fileId: resource.fileId
    }
  })
}

onMounted(loadViewTypes)
watch(() => props.resources, loadViewTypes)
</script>

<style scoped>
.viewtypes-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  padding: 16px;
}

.viewtype-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  border-radius: 12px;
  border: 1px solid var(--oc-role-outline-variant, #e0e0e0);
  background: var(--oc-role-surface, #fff);
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.viewtype-tile:hover {
  box-shadow: var(--oc-shadow-md, 0 4px 12px rgba(0,0,0,0.1));
  border-color: var(--oc-role-primary, #1976d2);
}

.viewtype-tile-label {
  font-weight: 600;
  font-size: 15px;
  text-align: center;
}

.viewtype-tile-name {
  font-size: 12px;
  opacity: 0.5;
  font-family: monospace;
}

.viewtype-tile-meta {
  font-size: 12px;
  opacity: 0.6;
}
</style>
