<template>
  <div class="rename-az-modal">
    <div class="rename-az-field">
      <div class="rename-az-switch-row">
        <label class="rename-az-label">{{ $gettext('File reference') }}</label>
        <oc-switch
          :checked="azEnabled"
          @update:checked="onAzToggle"
        />
      </div>
      <template v-if="azEnabled">
        <div class="rename-az-ref-row">
          <span class="rename-az-parent">{{ azPrefix }}</span>
          <input
            v-model="azNumber"
            class="rename-az-rest"
            :placeholder="padWidth > 0 ? '01' : '1'"
            :maxlength="2"
            @input="onAzNumberInput"
          />
        </div>
        <div class="rename-az-preview">
          <template v-if="azNumber">
            → {{ fullAzPreview }}
            <template v-if="fullAzPreview !== currentFullAz">
              <span v-if="azDuplicate" class="rename-az-taken">{{ $gettext('already taken') }}</span>
              <span v-else-if="azNumberValid" class="rename-az-free">{{ $gettext('available') }}</span>
            </template>
          </template>
        </div>
        <div v-if="azError" class="rename-az-error-msg">{{ azError }}</div>
      </template>
    </div>

    <div class="rename-az-field">
      <label class="rename-az-label">{{ resource.isFolder ? $gettext('Folder name') : $gettext('File name') }}</label>
      <input
        ref="nameInput"
        v-model="fileName"
        class="rename-az-name"
        @input="validateAll"
      />
    </div>

    <div v-if="error" class="rename-az-error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useGettext } from 'vue3-gettext'
import { isValidAzInput, formatAzNumber, isDuplicateAz } from '../composables/azFormat'

const { $gettext } = useGettext()

const props = defineProps<{
  modal: any
}>()

const emit = defineEmits<{
  'update:confirmDisabled': [value: boolean]
}>()

function attrs() { return props.modal?.customComponentAttrs?.() || {} }
const resource = computed(() => attrs().resource || {})
const parentAz = computed(() => attrs().parentAz || '')
const separator = computed(() => attrs().azSeparator || '')
const padWidth = computed(() => attrs().azPadWidth ?? 0)
const siblingRefs = computed<string[]>(() => attrs().azSiblingRefs || [])
const currentFullAz = computed(() => attrs().initialFullAz || '')

const azEnabled = ref(true)
const azNumber = ref('')
const fileName = ref('')
const error = ref('')
const azError = ref('')
const nameInput = ref<HTMLInputElement>()

const azPrefix = computed(() => parentAz.value + separator.value)

const azNumberValid = computed(() => isValidAzInput(azNumber.value))

const fullAzPreview = computed(() => {
  if (!azNumberValid.value) return azPrefix.value + azNumber.value
  const num = parseInt(azNumber.value, 10)
  return azPrefix.value + formatAzNumber(num, padWidth.value)
})

const azDuplicate = computed(() => {
  if (!azNumberValid.value) return false
  const preview = fullAzPreview.value
  // Don't flag as duplicate if it's the same as the current AZ (unchanged)
  if (preview === currentFullAz.value) return false
  return isDuplicateAz(siblingRefs.value, preview)
})

function onAzToggle(v: boolean) {
  azEnabled.value = v
  validateAll()
}

function onAzNumberInput() {
  azNumber.value = azNumber.value.replace(/\D/g, '')
  validateAll()
}

function validateAll() {
  let ok = true

  // Name validation
  if (!fileName.value.trim()) {
    error.value = $gettext('Name must not be empty')
    ok = false
  } else if (fileName.value.includes('/')) {
    error.value = $gettext('Name must not contain "/"')
    ok = false
  } else {
    error.value = ''
  }

  // AZ validation
  if (azEnabled.value) {
    if (!azNumber.value) {
      azError.value = ''
      ok = false
    } else if (!azNumberValid.value) {
      azError.value = $gettext('Enter a number from 1-99')
      ok = false
    } else if (azDuplicate.value) {
      azError.value = $gettext('File reference already taken')
      ok = false
    } else {
      azError.value = ''
    }
  } else {
    azError.value = ''
  }

  emit('update:confirmDisabled', !ok)
}

onMounted(() => {
  const a = attrs()
  fileName.value = a.initialName || ''
  azNumber.value = a.azInitialNumber || ''
  azEnabled.value = !!(a.azInitialNumber || a.initialFullAz)
  nextTick(() => {
    nameInput.value?.focus()
    nameInput.value?.select()
  })
  validateAll()
})

async function onConfirm() {
  const handler = props.modal?.customComponentAttrs?.()?.onRename
  if (handler) {
    const newAz = azEnabled.value ? fullAzPreview.value : ''
    await handler(fileName.value, newAz)
  }
}

defineExpose({ onConfirm })
</script>

<style scoped>
.rename-az-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 320px;
}
.rename-az-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rename-az-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.rename-az-label {
  font-weight: 600;
  font-size: 0.85em;
  color: var(--oc-color-text-muted, #666);
}
.rename-az-ref-row {
  display: flex;
  align-items: center;
  gap: 0;
}
.rename-az-parent {
  background: var(--oc-color-background-muted, #f0f0f0);
  border: 1px solid var(--oc-color-border, #ccc);
  border-right: none;
  border-radius: 4px 0 0 4px;
  padding: 6px 8px;
  color: var(--oc-color-text-muted, #888);
  font-family: monospace;
  white-space: nowrap;
}
.rename-az-rest {
  border: 1px solid var(--oc-color-border, #ccc);
  border-radius: 0 4px 4px 0;
  padding: 6px 8px;
  width: 60px;
  font-family: monospace;
  outline: none;
}
.rename-az-rest:focus {
  border-color: var(--oc-color-swatch-primary-default, #0070c0);
}
.rename-az-preview {
  font-size: 0.8em;
  color: var(--oc-color-text-muted, #999);
  font-family: monospace;
  min-height: 16px;
}
.rename-az-free {
  color: #2E7D32;
  font-weight: 600;
}
.rename-az-taken {
  color: #C62828;
  font-weight: 600;
}
.rename-az-name {
  border: 1px solid var(--oc-color-border, #ccc);
  border-radius: 4px;
  padding: 6px 8px;
  outline: none;
  width: 100%;
}
.rename-az-name:focus {
  border-color: var(--oc-color-swatch-primary-default, #0070c0);
}
.rename-az-error, .rename-az-error-msg {
  color: var(--oc-color-swatch-danger-default, #c00);
  font-size: 0.85em;
}
</style>
