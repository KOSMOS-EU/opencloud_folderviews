<template>
  <div class="element-frame" :class="{ 'menu-open': menuOpen }">
    <div class="element-frame-toolbar">
      <span class="element-frame-name">{{ resource.name }}</span>
      <div class="element-frame-menu-wrap">
        <button
          class="element-frame-menu"
          @click.stop.prevent="toggleMenu($event)"
        >
          <oc-icon name="more-2" size="small" />
        </button>
        <div v-if="menuOpen" class="element-frame-dropdown" :style="menuStyle" @click.stop>
          <button class="element-frame-action" @click="doDownload">
            <oc-icon name="download" size="small" />
            <span>Download</span>
          </button>
          <button class="element-frame-action" @click="doOpenSidebar">
            <oc-icon name="information" size="small" />
            <span>Details</span>
          </button>
        </div>
      </div>
    </div>
    <div class="element-frame-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Resource, SpaceResource } from '@opencloud-eu/web-client'
import { useClientService } from '@opencloud-eu/web-pkg'

const props = defineProps<{
  resource: Resource
  space: SpaceResource
}>()

const clientService = useClientService()
const menuOpen = ref(false)

const menuStyle = ref<Record<string, string>>({})

function toggleMenu(e: MouseEvent) {
  menuOpen.value = !menuOpen.value
  if (menuOpen.value) {
    const btn = (e.currentTarget as HTMLElement)
    const rect = btn.getBoundingClientRect()
    menuStyle.value = {
      position: 'fixed',
      top: rect.bottom + 4 + 'px',
      left: rect.right - 160 + 'px',
      zIndex: '9999'
    }
  }
}

function doDownload() {
  menuOpen.value = false
  const url = clientService.webdav.getFileUrl(props.space, props.resource)
  if (url) window.open(url, '_blank')
}

function doOpenSidebar() {
  menuOpen.value = false
  // TODO: integrate with sidebar
}

function closeOnOutsideClick() {
  if (menuOpen.value) menuOpen.value = false
}

onMounted(() => document.addEventListener('click', closeOnOutsideClick))
onUnmounted(() => document.removeEventListener('click', closeOnOutsideClick))
</script>

<style scoped>
.element-frame {
  border: 1px solid var(--oc-role-outline-variant, #e0e0e0);
  border-radius: 8px;
  overflow: hidden;
  background: var(--oc-role-surface, #fff);
  position: relative;
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
.element-frame-menu-wrap { position: relative; }
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
.element-frame-dropdown {
  min-width: 160px;
  background: var(--oc-role-surface, #fff);
  border: 1px solid var(--oc-role-outline-variant, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 4px 0;
}
.element-frame-action {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
  color: var(--oc-role-on-surface, #333);
}
.element-frame-action:hover {
  background: var(--oc-role-surface-variant, #f0f0f0);
}
.element-frame-content { padding: 0; }
</style>
