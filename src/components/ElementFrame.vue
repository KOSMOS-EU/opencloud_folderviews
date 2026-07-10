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
          <button v-if="!resource.isFolder" class="element-ctx-action" @click="doDownload">
            <oc-icon name="file-download" size="small" />
            <span>Download</span>
          </button>
          <button class="element-ctx-action" @click="doOpen">
            <oc-icon name="external-link" size="small" />
            <span>{{ resource.isFolder ? 'Öffnen' : 'Bearbeiten' }}</span>
          </button>
          <button class="element-ctx-action" @click="doDetails">
            <oc-icon name="information" size="small" />
            <span>Details</span>
          </button>
          <button class="element-ctx-action element-ctx-danger" @click="doDelete">
            <oc-icon name="delete-bin" size="small" />
            <span>Löschen</span>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Resource, SpaceResource } from '@opencloud-eu/web-client'
import { useRouter, useResourcesStore, useFileActions, useDownloadFile, useClientService } from '@opencloud-eu/web-pkg'
import { useFolderviewSettings } from '../composables/useFolderviewSettings'

const props = defineProps<{
  resource: Resource
  space: SpaceResource
}>()

const router = useRouter()
const resourcesStore = useResourcesStore()
const clientService = useClientService()
const { getDefaultAction } = useFileActions()
const { downloadFile } = useDownloadFile()
const { userAppCompact, userAppNewWindow } = useFolderviewSettings()

const emit = defineEmits<{ deleted: [] }>()
const menuOpen = ref(false)
const menuStyle = ref<Record<string, string>>({})

function doDownload() {
  close()
  downloadFile(props.space, props.resource)
}

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
    return
  }

  const opts = { resources: [props.resource], space: props.space }
  const action = getDefaultAction(opts) as any
  if (!action) return

  // If user has compact or new-window enabled, resolve route and open with extra params
  if ((userAppCompact.value || userAppNewWindow.value) && action.route) {
    const resolved = action.route(opts)
    if (resolved) {
      const query = { ...resolved.query }
      if (userAppCompact.value) query.appCompact = 'true'
      const href = router.resolve({ ...resolved, query }).href

      if (userAppNewWindow.value) {
        window.open(href, '_blank', 'noopener,menubar=no,toolbar=no,location=no,status=no')
        return
      }
      router.push({ path: resolved.path, query })
      return
    }
  }

  action.handler(opts)
}

function doDetails() {
  close()
  resourcesStore.upsertResource(props.resource)
  resourcesStore.setSelection([props.resource.id])
}

async function doDelete() {
  close()
  if (!confirm(`"${props.resource.name}" löschen?`)) return
  try {
    await clientService.webdav.deleteFile(props.space, { path: props.resource.path })
    emit('deleted')
  } catch (e) {
    console.error('[ElementFrame] delete failed:', e)
  }
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
.element-ctx-danger { color: #c62828; }
.element-ctx-danger:hover { background: #fbe9e7; }
</style>
