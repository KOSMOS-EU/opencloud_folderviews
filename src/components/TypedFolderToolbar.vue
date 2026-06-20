<template>
  <div v-if="isTyped && canCreate" class="typed-toolbar">
    <button
      v-for="child in childButtons"
      :key="child.type"
      class="typed-toolbar-btn"
      @click="child.action()"
    >
      <oc-icon name="add" size="small" />
      <span>{{ child.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, unref } from 'vue'
import { type SpaceResource } from '@opencloud-eu/web-client'
import { useResourcesStore } from '@opencloud-eu/web-pkg'
import { useTypedFolderActions } from '../composables/useTypedFolderActions'
import { useTypedFolderSchema } from '../composables/useTypedFolderSchema'

const props = defineProps<{
  space: SpaceResource
}>()

const resourcesStore = useResourcesStore()
const currentFolder = computed(() => resourcesStore.currentFolder)

// Detect type from resources (unfiltered)
const currentType = computed(() => {
  const resources = resourcesStore.resources || []
  const typeFile = resources.find(r => r.name?.startsWith('_type_'))
  return typeFile ? typeFile.name.substring(6) : undefined
})

const isTyped = computed(() => !!unref(currentType))

const spaceRef = computed(() => props.space)
const { schema } = useTypedFolderSchema(spaceRef, currentType)
const { createTypedChild, allowedChildren, canCreate } = useTypedFolderActions(
  spaceRef, currentFolder, schema
)

const typeLabels: Record<string, string> = {
  aktenplan: 'Neue Aktenstruktur',
  akte: 'Neue Akte',
  vorgang: 'Neuer Vorgang',
  register: 'Neues Register'
}

const childButtons = computed(() => {
  return unref(allowedChildren).map(childType => ({
    type: childType,
    label: typeLabels[childType] || `Neu: ${childType}`,
    action: () => {
      const label = typeLabels[childType] || childType
      const name = prompt(`Name (${label}):`)
      if (!name) return
      createTypedChild(childType, name.trim())
    }
  }))
})
</script>

<style scoped>
.typed-toolbar {
  display: flex;
  gap: 8px;
  padding: 6px 16px;
  border-bottom: 1px solid var(--oc-role-outline-variant, #e0e0e0);
  background: var(--oc-role-surface-variant, #f8f8f8);
}
.typed-toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: 1px solid var(--oc-role-primary, #1a73e8);
  border-radius: 6px;
  background: var(--oc-role-primary, #1a73e8);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}
.typed-toolbar-btn:hover {
  opacity: 0.9;
}
</style>
