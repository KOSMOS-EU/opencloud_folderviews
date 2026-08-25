<template>
  <div class="p-4 preview-panel">
    <oc-icon name="eye" fill-type="line" size="large" />
    <p class="preview-panel-state-text">{{ $gettext('Preview') }}</p>
    <p v-if="resource" class="preview-panel-filename">{{ resource.name }}</p>
  </div>
</template>

<script setup lang="ts">
import { useGettext } from 'vue3-gettext'

defineProps<{ space?: any; resource?: any }>()

const { $gettext } = useGettext()
</script>

<style scoped>
.preview-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.preview-panel-state-text {
  margin: 0;
  font-size: 13px;
  color: var(--oc-role-text-secondary, #666);
}
.preview-panel-filename {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  word-break: break-all;
  text-align: center;
}
</style>
