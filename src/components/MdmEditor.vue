<template>
  <div class="mdm-editor">
    <header class="mdm-header">
      <h2>{{ info?.name || resource?.name || 'MDM' }}</h2>
      <span v-if="info?.description" class="mdm-description">{{ info.description }}</span>
      <span v-if="info?.deviceCount" class="mdm-badge">{{ info.deviceCount }} Geräte</span>
    </header>

    <div v-if="loading" class="mdm-loading">
      <oc-spinner size="small" /> Laden...
    </div>
    <div v-else-if="error" class="mdm-error">{{ error }}</div>

    <template v-else>
      <!-- Tab bar -->
      <nav class="mdm-tabs">
        <oc-button
          v-for="tab in tabs"
          :key="tab.id"
          appearance="raw"
          class="mdm-tab"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
        </oc-button>
      </nav>

      <!-- Tab content -->
      <div class="mdm-content">
        <!-- Devices -->
        <div v-if="activeTab === 'devices'" class="tab-panel">
          <div v-for="udid in devices" :key="udid" class="list-item device-item">
            <oc-icon name="smartphone" size="small" />
            <span class="item-text">{{ udid }}</span>
          </div>
          <div v-if="!devices.length" class="empty">Keine Geräte</div>
        </div>

        <!-- Apps -->
        <div v-if="activeTab === 'apps'" class="tab-panel">
          <div v-for="app in apps" :key="app.id" class="list-item app-item">
            <oc-icon name="apps" size="small" />
            <span class="item-text">
              <span class="app-name">{{ app.comment || app.id }}</span>
              <a
                :href="'https://apps.apple.com/app/id' + app.id"
                target="_blank"
                class="store-link"
              >App Store</a>
            </span>
          </div>
          <div v-if="!apps.length" class="empty">Keine Apps</div>
        </div>

        <!-- Profiles -->
        <div v-if="activeTab === 'profiles'" class="tab-panel">
          <div v-for="profile in allProfiles" :key="profile" class="list-item profile-item">
            <label class="profile-check">
              <input
                type="checkbox"
                :checked="activeProfiles.includes(profile)"
                @change="toggleProfile(profile)"
              />
              <span>{{ profile }}</span>
            </label>
          </div>
          <div v-if="!allProfiles.length" class="empty">Keine Profile</div>
          <oc-button v-if="profilesDirty" appearance="filled" size="small" @click="saveProfiles">
            <oc-icon name="save" size="small" />
            <span>Speichern</span>
          </oc-button>
        </div>

        <!-- Actions -->
        <div v-if="activeTab === 'actions'" class="tab-panel">
          <div v-for="action in availableActions" :key="action.name" class="action-card">
            <div class="action-header">
              <strong>{{ action.label }}</strong>
            </div>
            <div v-if="action.params && action.params.length" class="action-params">
              <select
                v-for="param in action.params"
                :key="param"
                v-model="actionParams[action.name + '.' + param]"
                class="param-select"
              >
                <option value="">{{ param }}...</option>
                <option v-for="v in (paramOptions[action.name + '.' + param] || [param])" :key="v" :value="v">{{ v }}</option>
              </select>
            </div>
            <oc-button
              appearance="outline"
              size="small"
              :disabled="actionRunning === action.name"
              @click="executeAction(action)"
            >
              <oc-icon name="play-circle" size="small" />
              <span>{{ actionRunning === action.name ? 'Läuft...' : 'Ausführen' }}</span>
            </oc-button>
            <pre v-if="actionResults[action.name]" class="action-result" :class="{ 'action-error': actionResults[action.name].error }">{{ actionResults[action.name].output || actionResults[action.name].error }}</pre>
          </div>
          <div v-if="!availableActions.length" class="empty">Keine Actions konfiguriert</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useClientService } from '@opencloud-eu/web-pkg'

interface AppEntry { id: string; comment: string }
interface ActionDef { name: string; label: string; params?: string[] }
interface InfoMdm {
  name?: string
  description?: string
  deviceCount?: number
  contact?: string
  availableProfiles?: string[]
  availableActions?: ActionDef[]
  appStoreUrl?: string
}

const props = defineProps<{
  space: any
  resource: any
}>()

const clientService = useClientService()

const loading = ref(true)
const error = ref('')
const activeTab = ref('devices')

const info = ref<InfoMdm | null>(null)
const devices = ref<string[]>([])
const apps = ref<AppEntry[]>([])
const activeProfiles = ref<string[]>([])
const profilesDirty = ref(false)

const actionParams = ref<Record<string, string>>({})
const actionRunning = ref('')
const actionResults = ref<Record<string, any>>({})

const allProfiles = computed(() => info.value?.availableProfiles || [])
const availableActions = computed(() => info.value?.availableActions || [])

const paramOptions = computed(() => {
  const opts: Record<string, string[]> = {}
  for (const action of availableActions.value) {
    if (action.params) {
      for (const p of action.params) {
        if (p === 'profile') {
          opts[action.name + '.profile'] = allProfiles.value
        }
      }
    }
  }
  return opts
})

const tabs = computed(() => [
  { id: 'devices', label: 'Geräte', count: devices.value.length },
  { id: 'apps', label: 'Apps', count: apps.value.length },
  { id: 'profiles', label: 'Profile', count: activeProfiles.value.length },
  { id: 'actions', label: 'Actions', count: availableActions.value.length }
])

function parseLines(text: string): string[] {
  return text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
}

function parseApps(text: string): AppEntry[] {
  const entries: AppEntry[] = []
  let comment = ''
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#')) {
      comment = trimmed.substring(1).trim()
    } else if (/^\d+$/.test(trimmed)) {
      entries.push({ id: trimmed, comment })
      comment = ''
    }
  }
  return entries
}

async function loadFile(filename: string): Promise<string> {
  const folder = props.resource
  const parentPath = folder.path?.replace(/\/[^/]+$/, '') || ''
  const filePath = parentPath + '/' + filename
  try {
    const { body } = await clientService.webdav.getFileContents(props.space, { path: filePath }) as any
    return typeof body === 'string' ? body : new TextDecoder().decode(body)
  } catch {
    return ''
  }
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    // info.mdm is the resource itself
    const infoPath = props.resource.path
    const { body } = await clientService.webdav.getFileContents(props.space, { path: infoPath }) as any
    const raw = typeof body === 'string' ? body : new TextDecoder().decode(body)
    info.value = JSON.parse(raw)

    // Sibling files in same directory
    const parentPath = infoPath.replace(/\/[^/]+$/, '')
    const devText = await loadSibling(parentPath, 'devices')
    devices.value = parseLines(devText)

    const appText = await loadSibling(parentPath, 'apps')
    apps.value = parseApps(appText)

    const profText = await loadSibling(parentPath, 'profiles')
    activeProfiles.value = parseLines(profText)
    profilesDirty.value = false
  } catch (e: any) {
    error.value = e.message || String(e)
  } finally {
    loading.value = false
  }
}

async function loadSibling(parentPath: string, filename: string): Promise<string> {
  try {
    const { body } = await clientService.webdav.getFileContents(props.space, {
      path: parentPath + '/' + filename
    }) as any
    return typeof body === 'string' ? body : new TextDecoder().decode(body)
  } catch {
    return ''
  }
}

function toggleProfile(profile: string) {
  const idx = activeProfiles.value.indexOf(profile)
  if (idx >= 0) {
    activeProfiles.value.splice(idx, 1)
  } else {
    activeProfiles.value.push(profile)
  }
  profilesDirty.value = true
}

async function saveProfiles() {
  const parentPath = props.resource.path.replace(/\/[^/]+$/, '')
  const content = activeProfiles.value.join('\n') + '\n'
  try {
    await clientService.webdav.putFileContents(props.space, {
      path: parentPath + '/profiles',
      content
    })
    profilesDirty.value = false
  } catch (e: any) {
    alert('Speichern fehlgeschlagen: ' + e.message)
  }
}

async function executeAction(action: ActionDef) {
  actionRunning.value = action.name
  actionResults.value[action.name] = null

  const groupName = props.resource.path.split('/').slice(-2, -1)[0] || ''
  const params: Record<string, string> = {}
  if (action.params) {
    for (const p of action.params) {
      const val = actionParams.value[action.name + '.' + p]
      if (val) params[p] = val
    }
  }

  try {
    // Get mdmApiUrl from app config (set in apps.yaml)
    const apiUrl = (window as any).__mdmApiUrl || 'https://classroom.mux.nu:4443'
    const resp = await fetch(`${apiUrl}/api/v1/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action.name, group: groupName, params })
    })
    actionResults.value[action.name] = await resp.json()
  } catch (e: any) {
    actionResults.value[action.name] = { error: e.message }
  } finally {
    actionRunning.value = ''
  }
}

onMounted(loadData)
watch(() => props.resource?.path, loadData)
</script>

<style scoped>
.mdm-editor {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: var(--oc-font-family, sans-serif);
  color: var(--oc-role-on-surface, #222);
}

.mdm-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--oc-role-outline-variant, #ddd);
  flex-wrap: wrap;
}
.mdm-header h2 { margin: 0; font-size: 22px; }
.mdm-description { opacity: 0.6; font-size: 14px; }
.mdm-badge {
  background: #E8F5E9; color: #2E7D32;
  padding: 4px 10px; border-radius: 12px; font-size: 13px; font-weight: 500;
}

.mdm-loading {
  display: flex; align-items: center; gap: 8px;
  padding: 40px; justify-content: center;
  color: var(--oc-role-on-surface-variant, #666);
}
.mdm-error { padding: 40px; text-align: center; color: var(--oc-role-error, #D32F2F); }

.mdm-tabs {
  display: flex; gap: 0;
  border-bottom: 2px solid var(--oc-role-outline-variant, #ddd);
  margin-bottom: 16px;
}
.mdm-tab {
  padding: 10px 20px !important;
  font-size: 14px !important; font-weight: 500 !important;
  color: var(--oc-role-on-surface-variant, #666) !important;
  border-bottom: 2px solid transparent; margin-bottom: -2px;
  border-radius: 0 !important;
}
.mdm-tab:hover { color: var(--oc-role-on-surface, #222) !important; }
.mdm-tab.active {
  color: var(--oc-role-primary, #1976d2) !important;
  border-bottom-color: var(--oc-role-primary, #1976d2);
}
.tab-count {
  margin-left: 6px; background: var(--oc-role-surface-container, #f5f5f5);
  padding: 2px 8px; border-radius: 10px; font-size: 12px;
}

.tab-panel { min-height: 200px; }

.list-item {
  display: flex; align-items: center; gap: var(--oc-space-sm, 10px);
  padding: var(--oc-space-sm, 10px) var(--oc-space-md, 12px);
  border-bottom: 1px solid var(--oc-role-outline-variant, #eee);
}
.list-item:last-child { border-bottom: none; }
.item-text { flex: 1; font-size: 14px; }

.device-item .item-text { font-family: monospace; font-size: 13px; }

.app-name { font-weight: 500; }
.store-link {
  margin-left: var(--oc-space-sm, 8px); font-size: 12px;
  color: var(--oc-role-primary, #1976d2); text-decoration: none;
}
.store-link:hover { text-decoration: underline; }

.profile-check {
  display: flex; align-items: center; gap: var(--oc-space-sm, 8px);
  cursor: pointer; font-size: 14px;
}
.profile-check input { width: 18px; height: 18px; }

.action-card {
  padding: var(--oc-space-md, 16px); margin-bottom: var(--oc-space-md, 12px);
  border: 1px solid var(--oc-role-outline-variant, #ddd);
  border-radius: var(--oc-radius-md, 8px);
  background: var(--oc-role-surface, #fff);
}
.action-header { margin-bottom: var(--oc-space-sm, 8px); }
.action-params { display: flex; gap: var(--oc-space-sm, 8px); margin-bottom: var(--oc-space-sm, 8px); }
.param-select {
  padding: 6px 10px; border: 1px solid var(--oc-role-outline-variant, #ccc);
  border-radius: var(--oc-radius-sm, 4px); font-size: 13px;
  background: transparent; color: inherit;
}
.action-result {
  margin-top: var(--oc-space-sm, 8px); padding: var(--oc-space-sm, 10px);
  background: var(--oc-role-surface-container, #f5f5f5);
  border-radius: var(--oc-radius-sm, 4px); font-size: 12px;
  white-space: pre-wrap; max-height: 150px; overflow-y: auto;
}
.action-error { color: var(--oc-role-error, #D32F2F); }

.empty { padding: 40px; text-align: center; color: var(--oc-role-on-surface-variant, #999); }
</style>
