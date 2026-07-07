<template>
  <div v-if="appModeStore.isEnabled" class="app-mode-bar">
    <nav class="app-mode-primary">
      <button
        v-for="(item, idx) in menuItems"
        :key="idx"
        class="app-mode-item"
        :class="{ active: activeIndex === idx, 'has-children': item.children?.length }"
        @click="onPrimaryClick(item, idx)"
      >
        <oc-icon v-if="item.icon" :name="item.icon" size="small" />
        <span>{{ item.label }}</span>
        <span v-if="item.url" class="external-marker">↗</span>
      </button>
      <button class="app-mode-close" @click="exitAppMode" title="App Mode verlassen">✕</button>
    </nav>
    <nav v-if="secondaryItems.length > 0" class="app-mode-secondary">
      <button
        v-for="(child, cidx) in secondaryItems"
        :key="cidx"
        class="app-mode-item secondary"
        :class="{ active: activeSecondary === cidx }"
        @click="onSecondaryClick(child, cidx)"
      >
        <oc-icon v-if="child.icon" :name="child.icon" size="small" />
        <span>{{ child.label }}</span>
        <span v-if="child.url" class="external-marker">↗</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSpacesStore, useRouter } from '@opencloud-eu/web-pkg'
import { useAppModeStore } from '../composables/useAppModeStore'

const router = useRouter()
const spacesStore = useSpacesStore()
const appModeStore = useAppModeStore()

const activeIndex = ref(-1)
const activeSecondary = ref(-1)

const menuItems = computed(() => appModeStore.config?.menu || [])

const secondaryItems = computed(() => {
  if (activeIndex.value < 0) return []
  return menuItems.value[activeIndex.value]?.children || []
})

function navigateToPath(path: string) {
  const space = spacesStore.currentSpace
  if (!space) return
  const alias = appModeStore.spaceAlias || `${space.driveType}/${space.name?.toLowerCase().replace(/\s+/g, '-')}`
  const fullPath = `/files/spaces/${alias}${path === '/' ? '' : path}`
  router.push({ path: fullPath, query: { appMode: 'true', 'view-mode': 'resource-metro' } })
}

function onPrimaryClick(item: any, idx: number) {
  activeSecondary.value = -1
  if (item.url) {
    window.open(item.url, '_blank')
    return
  }
  if (item.children?.length) {
    activeIndex.value = activeIndex.value === idx ? -1 : idx
    return
  }
  activeIndex.value = idx
  if (item.path) navigateToPath(item.path)
}

function onSecondaryClick(item: any, cidx: number) {
  if (item.url) {
    window.open(item.url, '_blank')
    return
  }
  activeSecondary.value = cidx
  if (item.path) navigateToPath(item.path)
}

function exitAppMode() {
  appModeStore.disable()
  const { appMode, ...rest } = router.currentRoute.value.query
  router.push({ path: router.currentRoute.value.path, query: rest })
}
</script>

<style scoped>
.app-mode-bar {
  width: 100%;
}

.app-mode-primary, .app-mode-secondary {
  display: flex;
  align-items: center;
  gap: 2px;
  overflow-x: auto;
}

.app-mode-secondary {
  border-top: 1px solid var(--oc-role-outline-variant, #eee);
  padding-top: 2px;
}

.app-mode-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  color: inherit;
}

.app-mode-item:hover {
  background: var(--oc-role-surface-container, #f0f0f0);
}

.app-mode-item.active {
  background: var(--oc-role-primary, #0070c0);
  color: var(--oc-role-on-primary, #fff);
}

.app-mode-item.secondary {
  font-size: 13px;
  padding: 4px 12px;
}

.app-mode-close {
  margin-left: auto;
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  color: inherit;
  opacity: 0.5;
}

.app-mode-close:hover {
  opacity: 1;
}

.external-marker {
  font-size: 11px;
  opacity: 0.6;
}
</style>
