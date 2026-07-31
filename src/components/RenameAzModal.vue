<template>
  <div class="rename-az-modal">
    <div class="rename-az-field">
      <label class="rename-az-label">{{ $gettext('File reference') }}</label>
      <div class="rename-az-ref-row">
        <span class="rename-az-parent">{{ parentAz }}</span>
        <input
          ref="azInput"
          v-model="azRest"
          class="rename-az-rest"
          :placeholder="$gettext('e.g. .03')"
          @input="validate"
        />
      </div>
      <div class="rename-az-preview">{{ fullAz }}</div>
    </div>

    <div class="rename-az-field">
      <label class="rename-az-label">{{ resource.isFolder ? $gettext('Folder name') : $gettext('File name') }}</label>
      <input
        ref="nameInput"
        v-model="fileName"
        class="rename-az-name"
        @input="validate"
        @keydown.enter="onConfirm"
      />
    </div>

    <div v-if="error" class="rename-az-error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useGettext } from 'vue3-gettext'

const { $gettext } = useGettext()

const props = defineProps<{
  resource: any
  parentAz: string
  initialAzRest: string
  initialName: string
  onValidate?: (valid: boolean) => void
}>()

const azRest = ref(props.initialAzRest)
const fileName = ref(props.initialName)
const error = ref('')
const nameInput = ref<HTMLInputElement>()

const fullAz = computed(() => props.parentAz + azRest.value)

function validate() {
  if (!fileName.value.trim()) {
    error.value = $gettext('Name must not be empty')
    props.onValidate?.(false)
    return
  }
  if (fileName.value.includes('/')) {
    error.value = $gettext('Name must not contain "/"')
    props.onValidate?.(false)
    return
  }
  error.value = ''
  props.onValidate?.(true)
}

onMounted(() => {
  nameInput.value?.focus()
  nameInput.value?.select()
  validate()
})

defineExpose({
  getValues: () => ({
    fileName: fileName.value,
    fileReference: fullAz.value
  })
})
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
