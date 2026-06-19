<template>
  <div class="typed-folder-view register-view">
    <div class="typed-folder-header">
      <span class="typed-folder-type-badge register">Register</span>
      <span v-if="fileRef && showAktzInName" class="typed-folder-aktz">{{ fileRef }}</span>
      <span class="typed-folder-hint">Dokumente ablegen</span>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, Ref, unref } from 'vue'
import { Resource } from '@opencloud-eu/web-client'
import { useFolderviewSettings } from '../composables/useFolderviewSettings'
import { getFileReference } from '../composables/useFileReference'

const resource = inject<Ref<Resource>>('resource')
const { showAktzInName } = useFolderviewSettings()
const fileRef = computed(() => { const r = unref(resource); return r ? getFileReference(r) : '' })
</script>

<style scoped>
.typed-folder-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid #e0e0e0;
}
.typed-folder-type-badge.register {
  background: #fce4ec;
  color: #c62828;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}
.typed-folder-hint {
  font-size: 12px;
  color: #888;
}
.typed-folder-aktz { font-size: 13px; font-weight: 600; color: #c62828; font-family: monospace; }
</style>
