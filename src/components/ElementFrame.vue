<template>
  <div class="element-frame">
    <div class="element-frame-toolbar">
      <span class="element-frame-name">{{ resource.name }}</span>
      <button class="element-frame-menu" @click.stop.prevent="toggleMenu($event)">
        <oc-icon name="more-2" size="small" />
      </button>
    </div>
    <div class="element-frame-content">
      <slot />
    </div>
    <Teleport to="body">
      <div v-if="menuOpen" class="element-ctx-overlay" @click="close">
        <div class="element-ctx-dropdown" :style="menuStyle" @click.stop>
          <a v-if="!resource.isFolder" class="element-ctx-action" :href="downloadUrl" :download="resource.name">
            <oc-icon name="file-download" size="small" />
            <span>Download</span>
          </a>
          <button class="element-ctx-action" @click="doOpen">
            <oc-icon name="external-link" size="small" />
            <span>{{ resource.isFolder ? 'Öffnen' : 'Bearbeiten' }}</span>
          </button>
          <button class="element-ctx-action" @click="doDetails">
            <oc-icon name="information" size="small" />
            <span>Details</span>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Resource, SpaceResource } from '@opencloud-eu/web-client'
import { useRouter, useResourcesStore } from '@opencloud-eu/web-pkg'

const props = defineProps<{
  resource: Resource
  space: SpaceResource
}>()

const router = useRouter()
const resourcesStore = useResourcesStore()
const menuOpen = ref(false)
const menuStyle = ref<Record<string, string>>({})

// Build download URL from resource properties
const downloadUrl = computed(() => {
  if (props.resource.downloadURL) return props.resource.downloadURL
  // Fallback: WebDAV path
  return '/dav' + (props.resource.webDavPath || '')
})

function toggleMenu(e: MouseEvent) {
  if (menuOpen.value) { close(); return }
  const btn = e.currentTarget as HTMLElement
  const rect = btn.getBoundingClientRect()
  menuStyle.value = {
    top: rect.bottom + 4 + 'px',
    left: Math.max(8, rect.right - 220) + 'px'
  }
  menuOpen.value = true
}

function close() { menuOpen.value = false }

function doOpen() {
  close()
  if (props.resource.isFolder) {
    const currentPath = router.currentRoute.value.path
    router.push({ path: currentPath.replace(/\/$/, '') + '/' + props.resource.name })
  } else {
    // Trigger default action (open in editor/viewer)
    const fileId = props.resource.fileId || props.resource.id
    const currentPath = router.currentRoute.value.path
    const folder = currentPath
    router.push({ path: folder, query: { fileId, openWithDefault: 'true' } })
  }
}

function doDetails() {
  close()
  resourcesStore.setSelection([props.resource.id])
}
</script>

<style>
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
  background: none; border: none; cursor: pointer;
  display: flex; align-items: center; padding: 2px;
  border-radius: 4px; opacity: 0.5; flex-shrink: 0;
}
.element-frame:hover .element-frame-menu { opacity: 1; }
.element-frame-menu:hover { background: rgba(0,0,0,0.08); }
.element-frame-content { padding: 0; }
.element-ctx-overlay { position: fixed; inset: 0; z-index: 9998; }
.element-ctx-dropdown {
  position: fixed; z-index: 9999; min-width: 200px;
  background: var(--oc-role-surface, #fff);
  border: 1px solid var(--oc-role-outline-variant, #e0e0e0);
  border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.2); padding: 4px 0;
}
.element-ctx-action {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 8px 12px; border: none; background: none; cursor: pointer;
  font-size: 13px; text-align: left; text-decoration: none;
  color: var(--oc-role-on-surface, #333);
}
.element-ctx-action:hover { background: var(--oc-role-surface-variant, #f0f0f0); }
</style>
