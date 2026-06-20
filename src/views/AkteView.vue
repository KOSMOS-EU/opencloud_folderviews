<template>
  <div class="typed-folder-view akte-view">
    <div class="typed-folder-header">
      <span class="typed-folder-type-badge">Akte</span>
      <span v-if="fileRef && showAktzInName" class="typed-folder-aktz">{{ fileRef }}</span>
      <button v-if="canCreate" class="typed-action-btn" @click="createChild('vorgang')">
        <span class="typed-action-icon">+</span>
        Neuer Vorgang
      </button>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, unref } from 'vue'
import { useResourcesStore } from '@opencloud-eu/web-pkg'
import { useFolderviewSettings } from '../composables/useFolderviewSettings'
import { getFileReference } from '../composables/useFileReference'
import { useTypedFolderActions } from '../composables/useTypedFolderActions'
import { useTypedFolderSchema } from '../composables/useTypedFolderSchema'

const props = defineProps<{ space?: any }>()
const resourcesStore = useResourcesStore()
const { showAktzInName } = useFolderviewSettings()

const currentFolder = computed(() => resourcesStore.currentFolder)
const spaceRef = computed(() => props.space || resourcesStore.currentFolder)
const currentType = ref('akte')
const { schema } = useTypedFolderSchema(spaceRef, currentType)
const { createTypedChild, canCreate } = useTypedFolderActions(spaceRef, currentFolder, schema)

const fileRef = computed(() => {
  const r = unref(currentFolder)
  return r ? getFileReference(r) : ''
})

function createChild(childType: string) {
  const name = prompt('Name des Vorgangs:')
  if (!name) return
  createTypedChild(childType, name.trim())
}
</script>

<style scoped>
.typed-folder-header { display: flex; align-items: center; gap: 12px; padding: 8px 16px; border-bottom: 1px solid #e0e0e0; }
.typed-folder-type-badge { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: #e8f5e9; color: #2e7d32; }
.typed-folder-aktz { font-size: 13px; font-weight: 600; color: #1a73e8; font-family: monospace; }
.typed-action-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border: 1px solid #2e7d32; border-radius: 6px; background: #2e7d32; color: white; font-size: 13px; cursor: pointer; }
.typed-action-btn:hover { background: #1b5e20; }
.typed-action-icon { font-size: 16px; font-weight: 700; }
</style>
