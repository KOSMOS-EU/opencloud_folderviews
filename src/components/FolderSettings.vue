<template>
  <div class="folder-settings-overlay" @click.self="$emit('close')">
    <div class="folder-settings-panel">
      <div class="folder-settings-header">
        <h3>
          <oc-icon :name="schema?.icon || 'settings-3'" size="small" />
          {{ schema?.label || 'Einstellungen' }}
        </h3>
        <button class="folder-settings-close" @click="$emit('close')">
          <oc-icon name="close" size="small" />
        </button>
      </div>

      <div v-if="loading" class="folder-settings-loading">{{ $gettext('Loading...') }}</div>

      <div v-else class="folder-settings-body">
        <div class="folder-settings-info">
          <span class="folder-settings-name">{{ folderName }}</span>
          <span v-if="folderType" class="folder-settings-type-badge">{{ schema?.label || folderType }}</span>
        </div>

        <div v-for="(field, key) in editableFields" :key="key" class="folder-settings-field">
          <label>{{ field.label }}</label>

          <!-- String input -->
          <input
            v-if="field.type === 'string'"
            v-model="values[key]"
            class="folder-settings-input"
            :placeholder="field.label"
            :disabled="field.auto"
          />

          <!-- Enum select -->
          <select
            v-else-if="field.type === 'enum'"
            v-model="values[key]"
            class="folder-settings-input"
          >
            <option value="">— {{ $gettext('select') }} —</option>
            <option v-for="v in field.values" :key="v" :value="v">{{ v }}</option>
          </select>

          <!-- Number input -->
          <input
            v-else-if="field.type === 'number'"
            v-model.number="values[key]"
            type="number"
            class="folder-settings-input"
            :placeholder="field.label"
          />

          <!-- Date input -->
          <input
            v-else-if="field.type === 'date'"
            v-model="values[key]"
            type="date"
            class="folder-settings-input"
          />

          <!-- Color picker for oy.color -->
          <div v-if="key === 'oy.color'" class="folder-settings-colors">
            <button
              v-for="c in presetColors"
              :key="c"
              class="folder-settings-color-btn"
              :class="{ active: values[key] === c }"
              :style="{ backgroundColor: c }"
              @click="values[key] = c"
            />
            <input
              v-model="values[key]"
              type="color"
              class="folder-settings-color-custom"
              :title="$gettext('Custom color')"
            />
          </div>

          <span v-if="field.auto" class="folder-settings-hint">{{ $gettext('Assigned automatically') }}</span>
        </div>
      </div>

      <div class="folder-settings-footer">
        <button class="folder-settings-btn folder-settings-btn-cancel" @click="$emit('close')">{{ $gettext('Cancel') }}</button>
        <button class="folder-settings-btn folder-settings-btn-save" :disabled="saving" @click="save">
          {{ saving ? $gettext('Saving...') : $gettext('Save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Resource, SpaceResource } from '@opencloud-eu/web-client'
import { useClientService } from '@opencloud-eu/web-pkg'
import { TypedFolderSchema, TypedFieldDef } from '../composables/types'

const props = defineProps<{
  space: SpaceResource
  folder: Resource
  schema: TypedFolderSchema
  folderType: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const clientService = useClientService()
const loading = ref(true)
const saving = ref(false)
const values = ref<Record<string, string>>({})

const folderName = computed(() => props.folder?.name || '')

const presetColors = [
  '#8B1A1A', '#C62828', '#E65100', '#6D4C41',
  '#2E7D32', '#388E3C', '#00695C', '#1565C0',
  '#4527A0', '#7B1FA2', '#37474F', '#455A64'
]

const editableFields = computed(() => {
  const meta = props.schema?.metadata
  if (!meta) return {}
  return meta
})

async function loadMetadata() {
  loading.value = true
  const sp = props.space
  const folder = props.folder
  if (!sp || !folder) { loading.value = false; return }

  try {
    const httpClient = (clientService as any).httpAuthenticated
    if (!httpClient) { loading.value = false; return }
    const spaceId = sp.id
    const itemId = `${spaceId}!${folder.id.split('!').pop()}`
    const { data } = await httpClient.get(`/graph/v1beta1/drives/${spaceId}/items/${itemId}/metadata`)

    const vals: Record<string, string> = {}
    const meta = props.schema?.metadata || {}
    for (const key of Object.keys(meta)) {
      vals[key] = data?.[key] || ''
    }
    values.value = vals
  } catch {
    // Initialize with empty values
    const vals: Record<string, string> = {}
    for (const key of Object.keys(props.schema?.metadata || {})) {
      vals[key] = ''
    }
    values.value = vals
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  const sp = props.space
  const folder = props.folder
  if (!sp || !folder) { saving.value = false; return }

  try {
    const httpClient = (clientService as any).httpAuthenticated
    if (!httpClient) { saving.value = false; return }
    const spaceId = sp.id
    const itemId = `${spaceId}!${folder.id.split('!').pop()}`

    // Only send non-empty, non-auto values
    const meta: Record<string, string> = {}
    const schemaMeta = props.schema?.metadata || {}
    for (const [key, val] of Object.entries(values.value)) {
      if (val && !schemaMeta[key]?.auto) {
        meta[key] = val
      }
    }

    if (Object.keys(meta).length > 0) {
      await httpClient.put(
        `/graph/v1beta1/drives/${spaceId}/items/${itemId}/metadata`,
        meta
      )
    }

    emit('saved')
    emit('close')
    window.location.reload()
  } catch (e) {
    console.error('[FolderSettings] save failed:', e)
    alert('Speichern fehlgeschlagen')
  } finally {
    saving.value = false
  }
}

onMounted(() => loadMetadata())
</script>

<style scoped>
.folder-settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  justify-content: flex-end;
  z-index: 1000;
}
.folder-settings-panel {
  width: min(380px, 90vw);
  height: 100%;
  background: var(--oc-role-surface, #fff);
  box-shadow: -4px 0 16px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
}
.folder-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--oc-role-outline-variant, #ddd);
}
.folder-settings-header h3 {
  margin: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.folder-settings-close {
  background: none; border: none; cursor: pointer; padding: 4px;
  border-radius: 50%; display: flex;
}
.folder-settings-close:hover { background: var(--oc-role-surface-variant, #eee); }

.folder-settings-loading { padding: 40px; text-align: center; color: #888; }

.folder-settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.folder-settings-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--oc-role-outline-variant, #eee);
}
.folder-settings-name { font-weight: 600; font-size: 15px; }
.folder-settings-type-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--oc-role-surface-variant, #eee);
  border-radius: 3px;
  color: #666;
}

.folder-settings-field {
  margin-bottom: 16px;
}
.folder-settings-field label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 4px;
}
.folder-settings-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--oc-role-outline-variant, #ccc);
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}
.folder-settings-input:focus { outline: 2px solid #1565C0; outline-offset: -1px; }
.folder-settings-input:disabled { opacity: 0.6; background: var(--oc-role-surface-variant, #f5f5f5); }

.folder-settings-colors {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.folder-settings-color-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.1s;
}
.folder-settings-color-btn:hover { transform: scale(1.15); }
.folder-settings-color-btn.active { border-color: #000; box-shadow: 0 0 0 2px #fff, 0 0 0 4px #000; }
.folder-settings-color-custom {
  width: 24px; height: 24px;
  border: 1px dashed #999; border-radius: 50%;
  cursor: pointer; padding: 0; background: none;
}

.folder-settings-hint {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
  display: block;
}

.folder-settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--oc-role-outline-variant, #ddd);
}
.folder-settings-btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
}
.folder-settings-btn-cancel {
  background: none;
  border: 1px solid var(--oc-role-outline-variant, #ccc);
}
.folder-settings-btn-save { background: #1565C0; color: #fff; }
.folder-settings-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
