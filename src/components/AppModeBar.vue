<template>
  <div v-if="isAppMode" class="app-mode-bar">
    <div class="app-mode-header">
      <span class="app-mode-title">{{ appConfig?.name }}</span>
      <button class="app-mode-close" @click="exitAppMode" title="Zurück zur Cloud">✕</button>
    </div>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useSpacesStore, useRouter } from '@opencloud-eu/web-pkg'

interface MenuItem {
  label: string
  icon?: string
  path?: string
  url?: string
  children?: MenuItem[]
}

interface AppConfig {
  name: string
  icon?: string
  color?: string
  menu?: MenuItem[]
}

const props = defineProps<{
  space?: any
}>()

const router = useRouter()
const spacesStore = useSpacesStore()

const isAppMode = computed(() => router.currentRoute.value.query.appMode === 'true')
const activeIndex = ref(-1)
const activeSecondary = ref(-1)

// Find the app config for the current space
const appConfig = ref<AppConfig | null>(null)

// Read app config from window — set by the folderviews setup
const updateConfig = () => {
  const apps = (window as any).__spaceApps || []
  const space = spacesStore.currentSpace
  if (!space) return
  const app = apps.find((a: any) => space.id?.includes(a.spaceId?.split('!')[0]))
  if (app) {
    appConfig.value = app
  }
}

watch(() => spacesStore.currentSpace, updateConfig, { immediate: true })

const menuItems = computed<MenuItem[]>(() => appConfig.value?.menu || [])

const secondaryItems = computed<MenuItem[]>(() => {
  if (activeIndex.value < 0) return []
  return menuItems.value[activeIndex.value]?.children || []
})

function navigateToPath(path: string) {
  const space = spacesStore.currentSpace
  if (!space) return
  const alias = `${space.driveType}/${space.name?.toLowerCase().replace(/\s+/g, '-')}`
  const fullPath = `/files/spaces/${alias}${path === '/' ? '' : path}`
  router.push({ path: fullPath, query: { appMode: 'true' } })
}

function onPrimaryClick(item: MenuItem, idx: number) {
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

function onSecondaryClick(item: MenuItem, cidx: number) {
  if (item.url) {
    window.open(item.url, '_blank')
    return
  }
  activeSecondary.value = cidx
  if (item.path) navigateToPath(item.path)
}

function exitAppMode() {
  const { appMode, ...rest } = router.currentRoute.value.query
  router.push({ path: router.currentRoute.value.path, query: rest })
}

// Inject CSS class on body for app mode styling
onMounted(() => {
  if (isAppMode.value) document.body.classList.add('app-mode')
})

onUnmounted(() => {
  document.body.classList.remove('app-mode')
})

watch(isAppMode, (val) => {
  if (val) document.body.classList.add('app-mode')
  else document.body.classList.remove('app-mode')
})
</script>

<style>
/* Global app mode overrides */
body.app-mode .oc-sidebar-nav { display: none !important; }
body.app-mode #oc-topbar .topbar-center { display: none !important; }
body.app-mode .app-content { border-radius: 0 !important; }
</style>

<style scoped>
.app-mode-bar {
  border-bottom: 1px solid var(--oc-role-outline-variant, #ddd);
}

.app-mode-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
}

.app-mode-title {
  font-weight: 600;
  font-size: 16px;
}

.app-mode-close {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  color: inherit;
  opacity: 0.6;
}

.app-mode-close:hover {
  opacity: 1;
  background: var(--oc-role-surface-container, #f5f5f5);
}

.app-mode-primary, .app-mode-secondary {
  display: flex;
  gap: 2px;
  padding: 0 12px 4px;
  overflow-x: auto;
}

.app-mode-secondary {
  padding-top: 2px;
  border-top: 1px solid var(--oc-role-outline-variant, #eee);
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

.external-marker {
  font-size: 11px;
  opacity: 0.6;
}
</style>
