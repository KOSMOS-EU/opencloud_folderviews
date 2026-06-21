<template>
  <div class="p-4">
    <div v-if="loading" class="flex justify-center py-8">
      <oc-spinner size="small" />
    </div>

    <div v-else>
      <!-- Set schema when no type assigned -->
      <div v-if="!folderType" class="mb-6">
        <h4 class="text-sm font-semibold mb-2">{{ $gettext('Type schema') }}</h4>
        <div class="flex gap-2 items-center">
          <select v-model="selectedSchema" class="fs-input flex-1">
            <option value="">— {{ $gettext('select') }} —</option>
            <option v-for="s in availableSchemas" :key="s" :value="s">{{ s }}</option>
          </select>
          <oc-button size="small" :disabled="!selectedSchema || settingSchema" @click="setSchema">
            {{ $gettext('Set') }}
          </oc-button>
        </div>
      </div>

      <!-- Metadata fields -->
      <div v-for="(field, key) in editableFields" :key="key" class="mb-4">
        <h4 class="text-sm font-semibold mb-1">{{ field.label }}</h4>

        <input
          v-if="field.type === 'string'"
          v-model="values[key]"
          class="fs-input"
          :placeholder="field.label"
          :disabled="field.auto"
        />

        <select v-else-if="field.type === 'enum'" v-model="values[key]" class="fs-input">
          <option value="">— {{ $gettext('select') }} —</option>
          <option v-for="v in field.values" :key="v" :value="v">{{ v }}</option>
        </select>

        <input v-else-if="field.type === 'number'" v-model.number="values[key]" type="number" class="fs-input" />
        <input v-else-if="field.type === 'date'" v-model="values[key]" type="date" class="fs-input" />

        <div v-if="key === 'oy.color'" class="flex gap-1 flex-wrap mt-2">
          <button
            v-for="c in presetColors"
            :key="c"
            class="fs-color-swatch"
            :class="{ 'ring-2 ring-offset-2 ring-current': values[key] === c }"
            :style="{ backgroundColor: c }"
            @click="values[key] = c"
          />
          <input v-model="values[key]" type="color" class="fs-color-picker" />
        </div>

        <span v-if="field.auto" class="text-xs opacity-60">{{ $gettext('Assigned automatically') }}</span>
      </div>

      <!-- Add new metadata attribute -->
      <div class="mt-4 pt-4 border-t border-[var(--oc-role-outline-variant)]">
        <div class="flex gap-2 items-center">
          <select v-if="availableNewFields.length" v-model="newFieldKey" class="fs-input flex-1">
            <option value="">{{ $gettext('Add attribute') }}...</option>
            <option v-for="f in availableNewFields" :key="f.key" :value="f.key">{{ f.label }}</option>
          </select>
          <input v-else v-model="newFieldKey" class="fs-input flex-1" :placeholder="$gettext('Attribute key (e.g. oy.color)')" />
          <oc-button size="small" appearance="raw" :disabled="!newFieldKey" @click="addField">
            <oc-icon name="add" size="small" />
          </oc-button>
        </div>
      </div>

      <!-- Save -->
      <div class="mt-6">
        <oc-button class="w-full" variation="primary" appearance="filled" :disabled="saving" @click="save">
          {{ saving ? $gettext('Saving...') : $gettext('Save') }}
        </oc-button>
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
const settingSchema = ref(false)
const values = ref<Record<string, string>>({})
const schema = ref<any>(null)
const folderType = ref<string | null>(null)
const availableSchemas = ref<string[]>([])
const selectedSchema = ref('')

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

async function setSchema() {
  if (!selectedSchema.value || !props.space || !props.resource) return
  settingSchema.value = true
  try {
    const path = (props.resource.path || '/').replace(/\/$/, '') + `/_type_${selectedSchema.value}`
    await clientService.webdav.putFileContents(props.space, { path }, '')
    folderType.value = selectedSchema.value
    // Reload to pick up schema metadata
    await loadSchemaAndMetadata()
  } catch (e) {
    console.error('[FolderSettingsPanel] setSchema failed:', e)
  } finally {
    settingSchema.value = false
  }
}

function addField() {
  if (!newFieldKey.value) return
  const key = newFieldKey.value
  activeFields.value.add(key)
  if (!(key in values.value)) {
    values.value[key] = ''
  }
  // If key is not in schema metadata, add a string field definition
  if (schema.value && !schema.value.metadata?.[key]) {
    if (!schema.value.metadata) schema.value.metadata = {}
    schema.value.metadata[key] = { type: 'string', label: key }
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
    folderType.value = typeFile ? typeFile.name!.substring(6) : null

    // Load available schemas from .views/
    try {
      const { children: viewFiles } = await clientService.webdav.listFiles(sp, { path: '.views' })
      availableSchemas.value = viewFiles
        .filter((r: any) => r.name?.endsWith('.viewtype'))
        .map((r: any) => r.name!.replace('.viewtype', ''))
    } catch { availableSchemas.value = [] }

    if (!folderType.value) {
      schema.value = { metadata: {} }
      loading.value = false
      return
    }

    // Load schema
    const { body } = await clientService.webdav.getFileContents(sp, {
      path: `.views/${folderType.value}.viewtype`
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
.fs-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--oc-role-outline-variant, #ddd);
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  background: var(--oc-role-surface, #fff);
  color: var(--oc-role-on-surface, #333);
  transition: border-color 0.15s;
}
.fs-input:focus { outline: none; border-color: var(--oc-role-primary, #1976d2); }
.fs-input:disabled { opacity: 0.5; background: var(--oc-role-surface-variant, #f5f5f5); }
.fs-color-swatch {
  width: 24px; height: 24px; border-radius: 50%; border: none; cursor: pointer;
  transition: transform 0.1s;
}
.fs-color-swatch:hover { transform: scale(1.15); }
.fs-color-picker {
  width: 24px; height: 24px; border: 1px dashed var(--oc-role-outline, #aaa);
  border-radius: 50%; cursor: pointer; padding: 0;
}
</style>
