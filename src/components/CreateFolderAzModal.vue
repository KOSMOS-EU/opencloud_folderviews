<template>
  <div class="create-folder-az-modal">
    <div class="create-folder-az-field">
      <div class="create-folder-az-switch-row">
        <label class="create-folder-az-label">{{ $gettext('File reference') }}</label>
        <oc-switch
          v-if="!maxDepthReached"
          :checked="azEnabled"
          @update:checked="onAzToggle"
        />
        <span v-else class="create-folder-az-max-depth">{{ $gettext('Max depth reached') }}</span>
      </div>
      <template v-if="azEnabled && !maxDepthReached">
        <div class="create-folder-az-ref-row">
          <span class="create-folder-az-parent">{{ azPrefix }}</span>
          <input
            v-model="azNumber"
            class="create-folder-az-rest"
            :placeholder="padWidth > 0 ? '01' : '1'"
            :maxlength="2"
            @input="onAzNumberInput"
          />
        </div>
        <div class="create-folder-az-preview">
          <template v-if="azNumber">
            → {{ fullAzPreview }}
            <span v-if="azDuplicate" class="create-folder-az-taken">{{ $gettext('already taken') }}</span>
            <span v-else-if="azNumberValid" class="create-folder-az-free">{{ $gettext('available') }}</span>
          </template>
        </div>
        <div v-if="azError" class="create-folder-az-error">{{ azError }}</div>
      </template>
    </div>

    <div class="create-folder-az-field">
      <label class="create-folder-az-label">{{ $gettext('Folder name') }}</label>
      <input
        ref="nameInput"
        v-model="folderName"
        class="create-folder-az-name"
        @input="validate"
      />
    </div>

    <div v-if="error" class="create-folder-az-error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useGettext } from 'vue3-gettext'
import { isValidAzInput, formatAzNumber, isDuplicateAz, getAzDepth, MAX_AZ_DEPTH } from '../composables/azFormat'

const { $gettext } = useGettext()

const props = defineProps<{
  modal: any
}>()

const emit = defineEmits<{
  'update:confirmDisabled': [value: boolean]
}>()

function attrs() { return props.modal?.customComponentAttrs?.() || {} }
const parentAz = computed(() => {
  const v = attrs().parentAz
  return v ? String(v) : ''
})
const separator = computed(() => attrs().azSeparator || '')
const padWidth = computed(() => attrs().azPadWidth ?? 0)
const siblingRefs = computed<string[]>(() => attrs().azSiblingRefs || [])
const maxDepthReached = computed(() => getAzDepth(parentAz.value) >= MAX_AZ_DEPTH)

const azEnabled = ref(true)
const azNumber = ref('')
const folderName = ref('')
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
  return isDuplicateAz(siblingRefs.value, fullAzPreview.value)
})

function onAzToggle(v: boolean) {
  azEnabled.value = v
  validateAll()
}

function onAzNumberInput() {
  azNumber.value = azNumber.value.replace(/\D/g, '')
  validateAll()
}

function validate() {
  if (!folderName.value.trim()) {
    error.value = $gettext('Name must not be empty')
    emit('update:confirmDisabled', true)
    return false
  }
  if (folderName.value.includes('/')) {
    error.value = $gettext('Name must not contain "/"')
    emit('update:confirmDisabled', true)
    return false
  }
  error.value = ''
  return true
}

function validateAz() {
  if (!azEnabled.value || maxDepthReached.value) {
    azError.value = ''
    return true
  }
  if (!azNumber.value) {
    azError.value = ''
    emit('update:confirmDisabled', true)
    return false
  }
  if (!azNumberValid.value) {
    azError.value = $gettext('Enter a number from 1-99')
    emit('update:confirmDisabled', true)
    return false
  }
  if (azDuplicate.value) {
    azError.value = $gettext('File reference already taken')
    emit('update:confirmDisabled', true)
    return false
  }
  azError.value = ''
  return true
}

function validateAll() {
  const nameOk = validate()
  const azOk = validateAz()
  emit('update:confirmDisabled', !(nameOk && azOk))
}

onMounted(() => {
  const a = attrs()
  folderName.value = a.initialName || ''
  azNumber.value = a.azInitialNumber || ''
  azEnabled.value = !!parentAz.value && !maxDepthReached.value
  nextTick(() => {
    nameInput.value?.focus()
    nameInput.value?.select()
  })
  validateAll()
})

async function onConfirm() {
  const handler = attrs().onCreate
  if (handler) {
    const fileReference = (azEnabled.value && !maxDepthReached.value && azNumberValid.value)
      ? fullAzPreview.value
      : ''
    await handler(folderName.value.trim(), fileReference)
  }
}

defineExpose({ onConfirm })
</script>

<style scoped>
.create-folder-az-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 320px;
}
.create-folder-az-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.create-folder-az-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.create-folder-az-label {
  font-weight: 600;
  font-size: 0.85em;
  color: var(--oc-color-text-muted, #666);
}
.create-folder-az-ref-row {
  display: flex;
  align-items: center;
  gap: 0;
}
.create-folder-az-parent {
  background: var(--oc-color-background-muted, #f0f0f0);
  border: 1px solid var(--oc-color-border, #ccc);
  border-right: none;
  border-radius: 4px 0 0 4px;
  padding: 6px 8px;
  color: var(--oc-color-text-muted, #888);
  font-family: monospace;
  white-space: nowrap;
}
.create-folder-az-rest {
  border: 1px solid var(--oc-color-border, #ccc);
  border-radius: 0 4px 4px 0;
  padding: 6px 8px;
  width: 60px;
  font-family: monospace;
  outline: none;
}
.create-folder-az-rest:focus {
  border-color: var(--oc-color-swatch-primary-default, #0070c0);
}
.create-folder-az-preview {
  font-size: 0.8em;
  color: var(--oc-color-text-muted, #999);
  font-family: monospace;
  min-height: 16px;
}
.create-folder-az-free {
  color: #2E7D32;
  font-weight: 600;
}
.create-folder-az-taken {
  color: #C62828;
  font-weight: 600;
}
.create-folder-az-name {
  border: 1px solid var(--oc-color-border, #ccc);
  border-radius: 4px;
  padding: 6px 8px;
  outline: none;
  width: 100%;
}
.create-folder-az-name:focus {
  border-color: var(--oc-color-swatch-primary-default, #0070c0);
}
.create-folder-az-error {
  color: var(--oc-color-swatch-danger-default, #c00);
  font-size: 0.85em;
}
.create-folder-az-max-depth {
  font-size: 0.85em;
  color: var(--oc-color-text-muted, #999);
}
</style>
