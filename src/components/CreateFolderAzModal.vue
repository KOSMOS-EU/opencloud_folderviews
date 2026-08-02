<template>
  <div class="create-folder-az-modal">
    <div class="create-folder-az-field">
      <div class="create-folder-az-switch-row">
        <label class="create-folder-az-label">{{ $gettext('File reference') }}</label>
        <oc-switch
          :checked="azEnabled"
          @update:checked="onAzToggle"
        />
      </div>
      <template v-if="azEnabled">
        <div class="create-folder-az-ref-row">
          <span class="create-folder-az-parent">{{ parentAz }}</span>
          <input
            v-model="azRest"
            class="create-folder-az-rest"
            :placeholder="$gettext('e.g. .03')"
          />
        </div>
        <div v-if="azRest" class="create-folder-az-preview">→ {{ parentAz }}{{ azRest }}</div>
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

const azEnabled = ref(true)
const azRest = ref('')
const folderName = ref('')
const error = ref('')
const nameInput = ref<HTMLInputElement>()

function onAzToggle(v: boolean) {
  azEnabled.value = v
}

function validate() {
  if (!folderName.value.trim()) {
    error.value = $gettext('Name must not be empty')
    emit('update:confirmDisabled', true)
    return
  }
  if (folderName.value.includes('/')) {
    error.value = $gettext('Name must not contain "/"')
    emit('update:confirmDisabled', true)
    return
  }
  error.value = ''
  emit('update:confirmDisabled', false)
}

onMounted(() => {
  const a = attrs()
  folderName.value = a.initialName || ''
  azRest.value = a.initialAzRest || ''
  azEnabled.value = !!parentAz.value
  nextTick(() => {
    nameInput.value?.focus()
    nameInput.value?.select()
  })
  validate()
})

async function onConfirm() {
  const handler = attrs().onCreate
  if (handler) {
    const fileReference = azEnabled.value ? parentAz.value + azRest.value : ''
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
  flex: 1;
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
</style>
