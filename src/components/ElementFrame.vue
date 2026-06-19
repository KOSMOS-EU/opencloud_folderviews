<template>
  <div class="element-frame">
    <div class="element-frame-toolbar">
      <span class="element-frame-name">{{ resource.name }}</span>
      <button class="element-frame-menu" @click.stop="$emit('contextMenu', resource, $event)">
        <oc-icon name="more-2" size="small" />
      </button>
    </div>
    <div class="element-frame-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Resource } from '@opencloud-eu/web-client'

defineProps<{ resource: Resource }>()
defineEmits<{ contextMenu: [resource: Resource, event: MouseEvent] }>()
</script>

<style scoped>
.element-frame {
  border: 1px solid var(--oc-role-outline-variant, #e0e0e0);
  border-radius: 8px;
  overflow: hidden;
  background: var(--oc-role-surface, #fff);
}
.element-frame-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: var(--oc-role-surface-variant, #f5f5f5);
  border-bottom: 1px solid var(--oc-role-outline-variant, #e0e0e0);
  min-height: 28px;
}
.element-frame-name {
  font-size: 11px;
  color: var(--oc-role-on-surface-variant, #666);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.element-frame-menu {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: 4px;
  opacity: 0.5;
}
.element-frame:hover .element-frame-menu { opacity: 1; }
.element-frame-menu:hover { background: rgba(0,0,0,0.08); }
.element-frame-content { padding: 0; }
</style>
