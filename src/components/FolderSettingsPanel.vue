<template>
  <div class="folder-settings-panel-content">
    <div v-if="loading" class="folder-settings-loading">{{ $gettext('Loading...') }}</div>

    <div v-else class="folder-settings-body">
      <div v-for="(field, key) in editableFields" :key="key" class="folder-settings-field">
        <label>{{ field.label }}</label>

        <input
          v-if="field.type === 'string'"
          v-model="values[key]"
          class="folder-settings-input"
          :placeholder="field.label"
          :disabled="field.auto"
        />

        <select
          v-else-if="field.type === 'enum'"
          v-model="values[key]"
          class="folder-settings-input"
        >
          <option value="">— {{ $gettext('select') }} —</option>
          <option v-for="v in field.values" :key="v" :value="v">{{ v }}</option>
        </select>

        <input
          v-else-if="field.type === 'number'"
          v-model.number="values[key]"
          type="number"
          class="folder-settings-input"
        />

        <input
          v-else-if="field.type === 'date'"
          v-model="values[key]"
          type="date"
          class="folder-settings-input"
        />

        <div v-if="key === 'oy.color'" class="folder-settings-colors">
          <button
            v-for="c in presetColors"
            :key="c"
            class="folder-settings-color-btn"
            :class="{ active: values[key] === c }"
            :style="{ backgroundColor: c }"
            @click="values[key] = c"
          />
          <input v-model="values[key]" type="color" class="folder-settings-color-custom" />
        </div>

        <span v-if="field.auto" class="folder-settings-hint">{{ $gettext('Assigned automatically') }}</span>
      </div>

      <!-- Add new metadata attribute -->
      <div v-if="availableNewFields.length" class="folder-settings-add">
        <div class="folder-settings-add-row">
          <select v-model="newFieldKey" class="folder-settings-input folder-settings-add-select">
            <option value="">— {{ $gettext('Add attribute') }} —</option>
            <option v-for="f in availableNewFields" :key="f.key" :value="f.key">{{ f.label }}</option>
          </select>
          <button class="folder-settings-btn-add" :disabled="!newFieldKey" @click="addField">+</button>
        </div>
      </div>

      <div class="folder-settings-actions">
        <button class="folder-settings-btn-save" :disabled="saving" @click="save">
          {{ saving ? $gettext('Saving...') : $gettext('Save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useClientService } from '@opencloud-eu/web-pkg'

const props = defineProps<{
  space?: any
  resource?: any
}>()

const clientService = useClientService()
const loading = ref(true)
const saving = ref(false)
const values = ref<Record<string, string>>({})
const schema = ref<any>(null)

const presetColors = [
  '#8B1A1A', '#C62828', '#E65100', '#6D4C41',
  '#2E7D32', '#388E3C', '#00695C', '#1565C0',
  '#4527A0', '#7B1FA2', '#37474F', '#455A64'
]

const activeFields = ref<Set<string>>(new Set())
const newFieldKey = ref('')

const editableFields = computed(() => {
  const meta = schema.value?.metadata || {}
  const result: Record<string, any> = {}
  for (const [key, def] of Object.entries(meta)) {
    if (activeFields.value.has(key)) result[key] = def
  }
  return result
})

const availableNewFields = computed(() => {
  const meta = schema.value?.metadata || {}
  return Object.entries(meta)
    .filter(([key]) => !activeFields.value.has(key))
    .map(([key, def]: [string, any]) => ({ key, label: def.label || key }))
})

function addField() {
  if (!newFieldKey.value) return
  activeFields.value.add(newFieldKey.value)
  if (!(newFieldKey.value in values.value)) {
    values.value[newFieldKey.value] = ''
  }
  newFieldKey.value = ''
}

async function loadSchemaAndMetadata() {
  loading.value = true
  const sp = props.space
  const resource = props.resource
  if (!sp || !resource) { loading.value = false; return }

  try {
    // Detect folder type
    const { children } = await clientService.webdav.listFiles(sp, { path: resource.path || '/' })
    const typeFile = children.find((r: any) => r.name?.startsWith('_type_'))
    const folderType = typeFile ? typeFile.name!.substring(6) : null

    if (!folderType) { loading.value = false; return }

    // Load schema
    const { body } = await clientService.webdav.getFileContents(sp, {
      path: `.views/${folderType}.viewtype`
    }) as any
    schema.value = JSON.parse(typeof body === 'string' ? body : new TextDecoder().decode(body))

    // Load current metadata
    const httpClient = (clientService as any).httpAuthenticated
    if (httpClient && schema.value?.metadata) {
      const spaceId = sp.id
      const itemId = `${spaceId}!${resource.id.split('!').pop()}`
      const allKeys = Object.keys(schema.value.metadata)
      try {
        const { data } = await httpClient.get(`/graph/v1beta1/drives/${spaceId}/items/${itemId}/metadata`)
        const vals: Record<string, string> = {}
        const active = new Set<string>()
        for (const key of allKeys) {
          const val = data?.[key] || ''
          vals[key] = val
          if (val) active.add(key)
        }
        values.value = vals
        activeFields.value = active
      } catch {
        const vals: Record<string, string> = {}
        for (const key of allKeys) vals[key] = ''
        values.value = vals
        activeFields.value = new Set()
      }
    }
  } catch { /* no schema */ }
  finally { loading.value = false }
}

async function save() {
  saving.value = true
  const sp = props.space
  const resource = props.resource
  if (!sp || !resource) { saving.value = false; return }

  try {
    const httpClient = (clientService as any).httpAuthenticated
    if (!httpClient) { saving.value = false; return }
    const spaceId = sp.id
    const itemId = `${spaceId}!${resource.id.split('!').pop()}`

    const meta: Record<string, string> = {}
    const schemaMeta = schema.value?.metadata || {}
    for (const [key, val] of Object.entries(values.value)) {
      if (val && !schemaMeta[key]?.auto) meta[key] = val
    }

    if (Object.keys(meta).length > 0) {
      await httpClient.put(`/graph/v1beta1/drives/${spaceId}/items/${itemId}/metadata`, meta)
    }

    window.location.reload()
  } catch (e) {
    console.error('[FolderSettingsPanel] save failed:', e)
  } finally { saving.value = false }
}

watch(() => props.resource, () => loadSchemaAndMetadata(), { immediate: true })
</script>

<style scoped>
.folder-settings-panel-content { padding: 12px 16px; }
.folder-settings-loading { text-align: center; color: #888; padding: 20px; }
.folder-settings-field { margin-bottom: 14px; }
.folder-settings-field label { display: block; font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px; }
.folder-settings-input {
  width: 100%; padding: 6px 8px; border: 1px solid var(--oc-role-outline-variant, #ccc);
  border-radius: 4px; font-size: 13px; font-family: inherit;
}
.folder-settings-input:disabled { opacity: 0.6; background: var(--oc-role-surface-variant, #f5f5f5); }
.folder-settings-colors { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 4px; }
.folder-settings-color-btn {
  width: 22px; height: 22px; border-radius: 50%; border: 2px solid transparent; cursor: pointer;
}
.folder-settings-color-btn.active { border-color: #000; box-shadow: 0 0 0 2px #fff, 0 0 0 4px #000; }
.folder-settings-color-custom { width: 22px; height: 22px; border: 1px dashed #999; border-radius: 50%; cursor: pointer; padding: 0; }
.folder-settings-hint { font-size: 11px; color: #999; }
.folder-settings-actions { margin-top: 16px; }
.folder-settings-btn-save {
  width: 100%; padding: 8px; background: #1565C0; color: #fff; border: none;
  border-radius: 4px; font-size: 13px; cursor: pointer;
}
.folder-settings-btn-save:disabled { opacity: 0.5; }
.folder-settings-add { margin-top: 12px; margin-bottom: 8px; }
.folder-settings-add-row { display: flex; gap: 6px; }
.folder-settings-add-select { flex: 1; }
.folder-settings-btn-add {
  padding: 6px 12px; background: var(--oc-role-primary, #1565C0); color: #fff;
  border: none; border-radius: 4px; font-size: 16px; cursor: pointer; line-height: 1;
}
.folder-settings-btn-add:disabled { opacity: 0.4; }
</style>
