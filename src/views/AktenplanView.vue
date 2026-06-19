<template>
  <div class="typed-folder-view aktenplan-view">
    <div class="typed-folder-header">
      <span class="typed-folder-type-badge">{{ isShielded ? 'Aktenschrank' : 'Aktenplan' }}</span>
      <span v-if="fileRef && showAktzInName" class="typed-folder-aktz">{{ fileRef }}</span>
      <button v-if="canCreateChild" class="typed-action-btn" @click="showNewDialog = true">
        <span class="typed-action-icon">+</span>
        {{ isShielded ? 'Neue Akte' : 'Neue Sachgruppe' }}
      </button>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, inject, Ref, unref } from 'vue'
import { Resource } from '@opencloud-eu/web-client'
import { useFolderviewSettings } from '../composables/useFolderviewSettings'
import { getFileReference } from '../composables/useFileReference'

const resource = inject<Ref<Resource>>('resource')
const showNewDialog = ref(false)
const { showAktzInName } = useFolderviewSettings()

const isShielded = computed(() => unref(resource)?.immutableState === 'shielded')
const isProtected = computed(() => unref(resource)?.immutableState === 'protected')
const canCreateChild = computed(() => unref(isShielded) || !unref(isProtected))
const fileRef = computed(() => {
  const r = unref(resource)
  return r ? getFileReference(r) : ''
})
</script>

<style scoped>
.typed-folder-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid #e0e0e0;
}
.typed-folder-type-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: #e8eaf6;
  color: #3949ab;
}
.typed-folder-aktz {
  font-size: 13px;
  font-weight: 600;
  color: #1a73e8;
  font-family: monospace;
}
.typed-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: 1px solid #1a73e8;
  border-radius: 6px;
  background: #1a73e8;
  color: white;
  font-size: 13px;
  cursor: pointer;
}
.typed-action-btn:hover { background: #1565c0; }
.typed-action-icon { font-size: 16px; font-weight: 700; }
</style>
