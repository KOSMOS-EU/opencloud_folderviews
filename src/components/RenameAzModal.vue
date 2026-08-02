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
          <span class="rename-az-parent">{{ parentAz }}</span>
          <input
            v-model="azRest"
            class="rename-az-rest"
            :placeholder="$gettext('e.g. .03')"
            @input="validate"
          />
        </div>
        <div v-if="azRest" class="rename-az-preview">→ {{ parentAz }}{{ azRest }}</div>
      </template>
    </div>

    <div class="rename-az-field">
      <label class="rename-az-label">{{ resource.isFolder ? $gettext('Folder name') : $gettext('File name') }}</label>
      <input
        ref="nameInput"
        v-model="fileName"
        class="rename-az-name"
        @input="validate"
      />
    </div>

    <div v-if="error" class="rename-az-error">{{ error }}</div>
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

// Extract our data from modal.customComponentAttrs
function attrs() { return props.modal?.customComponentAttrs?.() || {} }
const resource = computed(() => attrs().resource || {})
const parentAz = computed(() => attrs().parentAz || '')

const azEnabled = ref(true)
const azRest = ref('')
const fileName = ref('')
const error = ref('')
const nameInput = ref<HTMLInputElement>()

const fullAz = computed(() => azEnabled.value ? parentAz.value + azRest.value : '')

function onAzToggle(v: boolean) {
  azEnabled.value = v
  validate()
}

function validate() {
  if (!fileName.value.trim()) {
    error.value = $gettext('Name must not be empty')
    emit('update:confirmDisabled', true)
    return
  }
  if (fileName.value.includes('/')) {
    error.value = $gettext('Name must not contain "/"')
    emit('update:confirmDisabled', true)
    return
  }
  error.value = ''
  emit('update:confirmDisabled', false)
}

onMounted(() => {
  const a = attrs()
  azRest.value = a.initialAzRest || ''
  fileName.value = a.initialName || ''
  // If no existing AZ, start with AZ section disabled
  azEnabled.value = !!(a.initialAzRest || a.initialFullAz)
  nextTick(() => {
    nameInput.value?.focus()
    nameInput.value?.select()
  })
  validate()
})

// Called by the modal framework on confirm
async function onConfirm() {
  const handler = props.modal?.customComponentAttrs?.()?.onRename
  if (handler) {
    await handler(fileName.value, fullAz.value)
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
  flex: 1;
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
.rename-az-error {
  color: var(--oc-color-swatch-danger-default, #c00);
  font-size: 0.85em;
}
</style>
