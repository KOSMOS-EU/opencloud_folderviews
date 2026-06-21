<template>
  <div class="viewtype-editor">
    <header>
      <h2>{{ schema?.label || fileName }}</h2>
      <div class="header-actions">
        <button v-if="dirty" class="save-btn" @click="save" :disabled="saving">
          {{ saving ? $gettext('Saving...') : $gettext('Save') }}
        </button>
        <span v-if="saved" class="saved-hint">{{ $gettext('Saved') }}</span>
      </div>
    </header>

    <div v-if="loading" class="loading">{{ $gettext('Loading...') }}</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <template v-else-if="schema">
      <!-- Basic Info -->
      <section class="editor-section">
        <h3>{{ $gettext('Basic info') }}</h3>
        <div class="field-row">
          <label>{{ $gettext('Label') }}</label>
          <input v-model="schema.label" @input="dirty = true" />
        </div>
        <div class="field-row">
          <label>{{ $gettext('Icon') }}</label>
          <input v-model="schema.icon" @input="dirty = true" placeholder="e.g. archive, folder, book-open" />
        </div>
      </section>

      <!-- Children -->
      <section class="editor-section">
        <h3>{{ $gettext('Allowed child types') }}</h3>
        <div v-if="Array.isArray(schema.children)" class="children-list">
          <div v-for="(child, idx) in schema.children" :key="idx" class="child-chip">
            <input v-model="schema.children[idx]" @input="dirty = true" class="chip-input" />
            <button class="chip-remove" @click="schema.children.splice(idx, 1); dirty = true">&times;</button>
          </div>
          <button class="add-btn" @click="schema.children.push(''); dirty = true">+ {{ $gettext('Type') }}</button>
        </div>
        <div v-else class="children-complex">
          <div v-for="key in Object.keys(schema.children)" :key="key" class="child-group">
            <label>{{ key }}</label>
            <div class="child-chips">
              <div v-for="(child, idx) in (schema.children as any)[key]" :key="idx" class="child-chip">
                <input v-model="(schema.children as any)[key][idx]" @input="dirty = true" class="chip-input" />
                <button class="chip-remove" @click="(schema.children as any)[key].splice(idx, 1); dirty = true">&times;</button>
              </div>
              <button class="add-btn" @click="(schema.children as any)[key].push(''); dirty = true">+</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Flags -->
      <section class="editor-section">
        <h3>{{ $gettext('Options') }}</h3>
        <label class="checkbox-row">
          <input type="checkbox" v-model="schema.isLeaf" @change="dirty = true" />
          {{ $gettext('Leaf (opens app instead of folder)') }}
        </label>
        <label class="checkbox-row">
          <input type="checkbox" v-model="schema.isContainer" @change="dirty = true" />
          {{ $gettext('Container (shows contents recursively)') }}
        </label>
        <label class="checkbox-row">
          <input type="checkbox" v-model="schema.protectButtonVisible" @change="dirty = true" />
          {{ $gettext('Show protect button') }}
        </label>
        <div class="field-row" v-if="schema.isLeaf">
          <label>App</label>
          <input v-model="schema.app" @input="dirty = true" placeholder="z.B. learn-editor" />
        </div>
        <div class="field-row" v-if="schema.isLeaf">
          <label>{{ $gettext('Entry file') }}</label>
          <input v-model="schema.appEntry" @input="dirty = true" placeholder="e.g. page.md" />
        </div>
        <div class="field-row">
          <label>{{ $gettext('Numbering') }}</label>
          <input v-model="schema.fileReferencePattern" @input="dirty = true" placeholder="{parentRef}.{seq:02}" />
        </div>
      </section>

      <!-- Metadata -->
      <section class="editor-section" v-if="schema.metadata">
        <h3>{{ $gettext('Metadata fields') }}</h3>
        <div v-for="(def, key) in schema.metadata" :key="key" class="meta-field">
          <div class="meta-key">{{ key }}</div>
          <div class="meta-inputs">
            <input v-model="def.label" @input="dirty = true" placeholder="Label" />
            <select v-model="def.type" @change="dirty = true">
              <option value="string">String</option>
              <option value="enum">Enum</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
            </select>
            <label class="checkbox-row small">
              <input type="checkbox" v-model="def.auto" @change="dirty = true" /> auto
            </label>
          </div>
        </div>
        <button class="add-btn" @click="addMetaField">+ Feld</button>
      </section>

      <!-- Raw JSON preview -->
      <section class="editor-section">
        <h3>JSON</h3>
        <pre class="json-preview">{{ jsonPreview }}</pre>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useClientService } from '@opencloud-eu/web-pkg'
import type { TypedFolderSchema } from '../composables/types'

const { $gettext } = useGettext()

const props = defineProps<{
  space: any
  resource: any
}>()

const clientService = useClientService()
const schema = ref<any>(null)
const loading = ref(true)
const error = ref('')
const dirty = ref(false)
const saving = ref(false)
const saved = ref(false)

const fileName = computed(() => props.resource?.name || '')

const jsonPreview = computed(() => {
  if (!schema.value) return ''
  return JSON.stringify(schema.value, null, 2)
})

async function loadFile() {
  loading.value = true
  error.value = ''
  try {
    const { body } = await clientService.webdav.getFileContents(props.space, {
      path: props.resource.path
    }) as any
    const raw = typeof body === 'string' ? body : new TextDecoder().decode(body)
    schema.value = JSON.parse(raw)
    dirty.value = false
  } catch (e: any) {
    error.value = `Fehler: ${e.message || e}`
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!schema.value) return
  saving.value = true
  saved.value = false
  try {
    const content = JSON.stringify(schema.value, null, 2)
    await clientService.webdav.putFileContents(props.space, {
      path: props.resource.path,
      content
    })
    dirty.value = false
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  } catch (e: any) {
    error.value = `Speichern fehlgeschlagen: ${e.message || e}`
  } finally {
    saving.value = false
  }
}

function addMetaField() {
  if (!schema.value) return
  if (!schema.value.metadata) schema.value.metadata = {}
  const key = prompt($gettext('Metadata key (e.g. oy.status)'))
  if (!key) return
  schema.value.metadata[key] = { label: key, type: 'string' }
  dirty.value = true
}

onMounted(loadFile)
watch(() => props.resource?.path, loadFile)
</script>

<style scoped>
.viewtype-editor {
  padding: 20px;
  max-width: 720px;
  margin: 0 auto;
  font-family: var(--oc-font-family, sans-serif);
  color: var(--oc-role-on-surface, #222);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--oc-role-outline-variant, #ddd);
}

header h2 { margin: 0; font-size: 22px; }

.header-actions { display: flex; align-items: center; gap: 12px; }

.save-btn {
  padding: 8px 20px;
  background: var(--oc-role-primary, #1976D2);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.save-btn:disabled { opacity: 0.5; cursor: default; }
.saved-hint { color: #2E7D32; font-size: 13px; }

.loading, .error {
  padding: 40px;
  text-align: center;
}

.error { color: #D32F2F; }

.editor-section {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--oc-role-surface, #fff);
  border-radius: 8px;
  border: 1px solid var(--oc-role-outline-variant, #e0e0e0);
}

.editor-section h3 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--oc-role-on-surface-variant, #555);
}

.field-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.field-row label {
  width: 120px;
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0;
}

.field-row input, .field-row select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--oc-role-outline-variant, #ccc);
  border-radius: 4px;
  font-size: 14px;
  background: transparent;
  color: inherit;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 14px;
  cursor: pointer;
}

.checkbox-row.small { font-size: 12px; }

.checkbox-row input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.children-list, .child-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.child-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--oc-role-surface-container, #f5f5f5);
  border-radius: 16px;
  padding: 4px 8px;
}

.chip-input {
  border: none;
  background: transparent;
  font-size: 13px;
  width: 80px;
  color: inherit;
}

.chip-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.5;
  color: inherit;
}

.chip-remove:hover { opacity: 1; }

.child-group {
  margin-bottom: 8px;
}

.child-group > label {
  font-size: 13px;
  font-weight: 500;
  display: block;
  margin-bottom: 4px;
}

.children-complex { margin-top: 8px; }

.add-btn {
  padding: 4px 12px;
  background: transparent;
  border: 1px dashed var(--oc-role-outline-variant, #ccc);
  border-radius: 16px;
  cursor: pointer;
  font-size: 13px;
  color: inherit;
}

.add-btn:hover { background: var(--oc-role-surface-container, #f5f5f5); }

.meta-field {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  align-items: center;
}

.meta-key {
  width: 140px;
  font-family: monospace;
  font-size: 13px;
  flex-shrink: 0;
}

.meta-inputs {
  display: flex;
  gap: 8px;
  flex: 1;
  align-items: center;
}

.meta-inputs input, .meta-inputs select {
  padding: 6px 8px;
  border: 1px solid var(--oc-role-outline-variant, #ccc);
  border-radius: 4px;
  font-size: 13px;
  background: transparent;
  color: inherit;
}

.json-preview {
  background: var(--oc-role-surface-container, #f5f5f5);
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}
</style>
