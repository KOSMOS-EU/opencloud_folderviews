<template>
  <div class="typed-folder-view aktenplan-view">
    <div class="typed-folder-header">
      <span class="typed-folder-type-badge">{{ badgeLabel }}</span>
      <span v-if="fileRef && showAktzInName" class="typed-folder-aktz">{{ fileRef }}</span>
      <button
        v-for="childType in allowedChildren"
        :key="childType"
        v-if="canCreate"
        class="typed-action-btn"
        @click="createChild(childType)"
      >
        <span class="typed-action-icon">+</span>
        {{ childType === 'aktenplan' ? 'Neue Aktenstruktur' : 'Neue Akte' }}
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

// NOTE: This view is NOT mounted by GenericSpace - folderViewHandlers are unused
// Buttons must be placed in ResourceTree/Metro/Elements instead

const currentFolder = computed(() => resourcesStore.currentFolder)
const spaceRef = computed(() => props.space || resourcesStore.currentFolder)
const currentType = ref('aktenplan')
const { schema } = useTypedFolderSchema(spaceRef, currentType)

const { createTypedChild, allowedChildren, canCreate } = useTypedFolderActions(
  spaceRef, currentFolder, schema
)

const isShielded = computed(() => (unref(currentFolder) as any)?.immutableState === 'shielded')
const badgeLabel = computed(() => unref(isShielded) ? 'Aktenschrank' : 'Aktenplan')

const fileRef = computed(() => {
  const r = unref(currentFolder)
  return r ? getFileReference(r) : ''
})

function createChild(childType: string) {
  const name = prompt(childType === 'aktenplan' ? 'Name der Aktenstruktur:' : 'Name der Akte:')
  if (!name) return
  createTypedChild(childType, name.trim())
}
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
