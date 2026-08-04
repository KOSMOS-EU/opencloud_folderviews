<template>
  <div class="create-dialog-overlay" @click.self="$emit('cancel')">
    <div class="create-dialog">
      <div class="create-dialog-header">
        <h3>{{ title }}</h3>
        <button class="create-dialog-close" @click="$emit('cancel')">
          <oc-icon name="close" size="small" />
        </button>
      </div>
      <div class="create-dialog-body">
        <template v-if="hasAzSupport">
          <div class="create-az-switch-row">
            <label>{{ $gettext('File reference') }}</label>
            <oc-switch
              v-if="!maxDepthReached"
              :checked="azEnabled"
              @update:checked="azEnabled = $event; validateAz()"
            />
            <span v-else class="create-az-max-depth">{{ $gettext('Max depth reached') }}</span>
          </div>
          <template v-if="azEnabled && !maxDepthReached">
            <div class="create-az-ref-row">
              <span class="create-az-parent">{{ azPrefix }}</span>
              <input
                v-model="azNumber"
                class="create-az-rest"
                :placeholder="azPadWidth > 0 ? '01' : '1'"
                :maxlength="2"
                @input="onAzNumberInput"
              />
            </div>
            <div class="create-az-preview">
              <template v-if="azNumber">
                → {{ fullAzPreview }}
                <span v-if="azDuplicate" class="create-az-taken">{{ $gettext('already taken') }}</span>
                <span v-else-if="azNumberValid" class="create-az-free">{{ $gettext('available') }}</span>
              </template>
            </div>
            <div v-if="azError" class="create-az-error">{{ azError }}</div>
          </template>
        </template>

        <label>{{ $gettext('Name') }}</label>
        <input
          ref="nameInput"
          v-model="name"
          class="create-input"
          :placeholder="$gettext('Enter name...')"
          @keyup.enter="submit"
        />

        <template v-if="showColor">
          <label>{{ $gettext('Color') }}</label>
          <div class="create-color-grid">
            <button
              v-for="c in colors"
              :key="c.value"
              class="create-color-btn"
              :class="{ active: color === c.value }"
              :style="{ backgroundColor: c.value }"
              :title="c.label"
              @click="color = c.value"
            />
            <input
              v-model="color"
              type="color"
              class="create-color-custom"
              :title="$gettext('Custom color')"
            />
          </div>
        </template>

        <template v-if="showNote">
          <label>{{ $gettext('Description') }} <span class="create-optional">({{ $gettext('optional') }})</span></label>
          <input
            v-model="note"
            class="create-input"
            :placeholder="$gettext('Short description...')"
          />
        </template>
      </div>
      <div class="create-dialog-footer">
        <button class="create-btn create-btn-cancel" @click="$emit('cancel')">{{ $gettext('Cancel') }}</button>
        <button class="create-btn create-btn-ok" :disabled="!canSubmit" @click="submit">{{ $gettext('Create') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { isValidAzInput, formatAzNumber, isDuplicateAz, getNextLevelInfo, getAzDepth, MAX_AZ_DEPTH } from '../composables/azFormat'

const props = defineProps<{
  title: string
  showColor?: boolean
  showNote?: boolean
  parentAz?: string
  azSeparator?: string
  azPadWidth?: number
  azInitialNumber?: string
  azSiblingRefs?: string[]
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm', data: { name: string; color?: string; note?: string; fileReference?: string }): void
}>()

const name = ref('')
const color = ref('#1565C0')
const note = ref('')
const azEnabled = ref(true)
const azNumber = ref('')
const azError = ref('')
const nameInput = ref<HTMLInputElement>()

const hasAzSupport = computed(() => props.parentAz !== undefined && props.parentAz !== null)
const maxDepthReached = computed(() => {
  if (!hasAzSupport.value) return false
  return getAzDepth(props.parentAz || '') >= MAX_AZ_DEPTH
})

const azPrefix = computed(() => {
  const sep = props.azSeparator ?? ''
  return (props.parentAz || '') + sep
})

const azNumberValid = computed(() => isValidAzInput(azNumber.value))

const fullAzPreview = computed(() => {
  if (!azNumberValid.value) return azPrefix.value + azNumber.value
  const num = parseInt(azNumber.value, 10)
  const padWidth = props.azPadWidth ?? 0
  return azPrefix.value + formatAzNumber(num, padWidth)
})

const azDuplicate = computed(() => {
  if (!azNumberValid.value || !props.azSiblingRefs) return false
  return isDuplicateAz(props.azSiblingRefs, fullAzPreview.value)
})

const canSubmit = computed(() => {
  if (!name.value.trim()) return false
  if (azEnabled.value && hasAzSupport.value && !maxDepthReached.value) {
    if (!azNumberValid.value || azDuplicate.value) return false
  }
  return true
})

const colors = [
  { value: '#8B1A1A', label: 'Dunkelrot' },
  { value: '#C62828', label: 'Rot' },
  { value: '#E65100', label: 'Orange' },
  { value: '#6D4C41', label: 'Braun' },
  { value: '#2E7D32', label: 'Grün' },
  { value: '#388E3C', label: 'Hellgrün' },
  { value: '#00695C', label: 'Teal' },
  { value: '#1565C0', label: 'Blau' },
  { value: '#4527A0', label: 'Lila' },
  { value: '#7B1FA2', label: 'Violett' },
  { value: '#37474F', label: 'Grau' },
  { value: '#455A64', label: 'Blaugrau' }
]

function onAzNumberInput() {
  // Strip non-digits
  azNumber.value = azNumber.value.replace(/\D/g, '')
  validateAz()
}

function validateAz() {
  if (!azEnabled.value || maxDepthReached.value) {
    azError.value = ''
    return
  }
  if (azNumber.value && !azNumberValid.value) {
    azError.value = 'Zahl von 1-99 eingeben'
    return
  }
  if (azDuplicate.value) {
    azError.value = 'Aktenzeichen bereits vergeben'
    return
  }
  azError.value = ''
}

function submit() {
  if (!canSubmit.value) return
  const data: { name: string; color?: string; note?: string; fileReference?: string } = {
    name: name.value.trim(),
    color: color.value || undefined,
    note: note.value.trim() || undefined
  }
  if (hasAzSupport.value) {
    if (azEnabled.value && !maxDepthReached.value && azNumberValid.value) {
      data.fileReference = fullAzPreview.value
    } else {
      data.fileReference = ''
    }
  }
  emit('confirm', data)
}

onMounted(() => {
  azNumber.value = props.azInitialNumber || ''
  azEnabled.value = hasAzSupport.value && !maxDepthReached.value
  nextTick(() => nameInput.value?.focus())
})
</script>

<style scoped>
.create-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.create-dialog {
  background: var(--oc-role-surface, #fff);
  border-radius: 8px;
  width: min(420px, 90vw);
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
.create-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 8px;
}
.create-dialog-header h3 { margin: 0; font-size: 16px; }
.create-dialog-close {
  background: none; border: none; cursor: pointer; padding: 4px;
  border-radius: 50%; display: flex;
}
.create-dialog-close:hover { background: var(--oc-role-surface-variant, #eee); }
.create-dialog-body {
  padding: 8px 20px 16px;
}
.create-dialog-body label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin: 12px 0 4px;
}
.create-optional { font-weight: 400; color: #999; }
.create-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--oc-role-outline-variant, #ccc);
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}
.create-input:focus { outline: 2px solid #1565C0; outline-offset: -1px; }
.create-color-grid {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}
.create-color-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.1s;
}
.create-color-btn:hover { transform: scale(1.15); }
.create-color-btn.active { border-color: #000; box-shadow: 0 0 0 2px #fff, 0 0 0 4px #000; }
.create-color-custom {
  width: 28px;
  height: 28px;
  border: 1px dashed #999;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  background: none;
}
.create-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 20px 16px;
}
.create-btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
}
.create-btn-cancel {
  background: none;
  border: 1px solid var(--oc-role-outline-variant, #ccc);
}
.create-btn-ok {
  background: #1565C0;
  color: #fff;
}
.create-btn-ok:disabled { opacity: 0.4; cursor: not-allowed; }
.create-az-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0 4px;
}
.create-az-ref-row {
  display: flex;
  align-items: center;
  gap: 0;
  margin-top: 4px;
}
.create-az-parent {
  background: var(--oc-color-background-muted, #f0f0f0);
  border: 1px solid var(--oc-color-border, #ccc);
  border-right: none;
  border-radius: 4px 0 0 4px;
  padding: 6px 8px;
  color: var(--oc-color-text-muted, #888);
  font-family: monospace;
  white-space: nowrap;
}
.create-az-rest {
  border: 1px solid var(--oc-color-border, #ccc);
  border-radius: 0 4px 4px 0;
  padding: 6px 8px;
  width: 60px;
  font-family: monospace;
  outline: none;
  font-size: 14px;
}
.create-az-rest:focus {
  border-color: var(--oc-color-swatch-primary-default, #0070c0);
}
.create-az-preview {
  font-size: 12px;
  color: var(--oc-color-text-muted, #999);
  font-family: monospace;
  margin-top: 2px;
  min-height: 18px;
}
.create-az-free {
  color: #2E7D32;
  font-weight: 600;
}
.create-az-taken {
  color: #C62828;
  font-weight: 600;
}
.create-az-error {
  color: var(--oc-color-swatch-danger-default, #c00);
  font-size: 0.85em;
  margin-top: 2px;
}
.create-az-max-depth {
  font-size: 0.85em;
  color: var(--oc-color-text-muted, #999);
}
</style>
