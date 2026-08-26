<template>
  <div class="office-viewer">
    <div v-if="error" class="office-viewer-state">
      <oc-icon name="file" fill-type="line" size="large" />
      <p class="office-viewer-state-text">{{ error }}</p>
    </div>
    <template v-else>
      <oc-spinner v-if="loading" :size="32" class="office-viewer-loading" />
      <iframe
        v-if="frameUrl || frameForm"
        name="office-preview-frame"
        :src="frameUrl || undefined"
        class="office-viewer-frame"
      ></iframe>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * Read-only Vorschau für Office-Docs (docx/doc/odt/rtf) über Collabora Online.
 *
 * Vorschau-API wie der Host, opencloud_web/packages/web-app-external/src/App.vue
 * (loadAppUrl): POST {serverUrl}/{capabilityStore.filesAppProviders[0].open_url}
 *   ?file_id=…&lang=…&app_name=…&view_mode=read
 * → { app_url, method, form_parameters } → (POST-Formular in) iframe.
 * view_mode ist hier immer 'read' — die Vorschau ist strikt read-only,
 * der Edit-PostMessage-Handler des Hosts (UI_Edit → write) wird bewusst
 * NICHT mitkopiert.
 */
import { ref, watch, onBeforeUnmount } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useClientService, useConfigStore, useCapabilityStore, useThemeStore } from '@opencloud-eu/web-pkg'
import { urlJoin } from '@opencloud-eu/web-client'

const props = defineProps<{ space: any; resource: any }>()

const { $gettext, current: localeCurrent } = useGettext() as any
const clientService = useClientService()
const configStore = useConfigStore()
const capabilityStore = useCapabilityStore()
const themeStore = useThemeStore()

const loading = ref(false)
const error = ref('')
const frameUrl = ref('')
const frameForm = ref<{ action: string; params: Record<string, string> } | null>(null)

let openSeq = 0

// App-Handler-Adresse (FRONTEND_APP_HANDLER_SECURE_VIEW_APP_ADDR im
// Kosmos-Rollout). Der Kosmos-Standard ist Collabora Online; ohne
// serverseitige Capability, die die Adresse exponiert, wird hier
// der Rollout-Default verwendet.
const collaboraAppName = () => 'eu.opencloud.api.collaboration.CollaboraOnline'

const providerOpenUrl = () => {
  // Provider aus den Capabilities (opencloud: /app/open)
  const providers: any[] = (capabilityStore as any).filesAppProviders || []
  const openUrl = providers.find((p) => p?.open_url)?.open_url
  if (openUrl) return openUrl
  // Fallback auf den klassischen collaboration-Pfad
  return 'remote.php/apps/collaboration/office'
}

const uiDefaults = () => {
  const theme = (themeStore as any).currentTheme?.isDark ? 'dark' : 'light'
  return `UITheme=${theme}`
}

function submitForm() {
  const frameFormValue = frameForm.value
  if (!frameFormValue) return
  const form = document.createElement('form')
  form.action = frameFormValue.action
  form.method = 'post'
  form.target = 'office-preview-frame'
  form.style.display = 'none'
  for (const [key, value] of Object.entries(frameFormValue.params)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = value
    form.appendChild(input)
  }
  document.body.appendChild(form)
  form.submit()
  form.remove()
}

async function openOfficeDoc(resource: any, seq: number) {
  error.value = ''
  frameUrl.value = ''
  frameForm.value = null
  loading.value = true

  const query = new URLSearchParams()
  query.set('file_id', String(resource.fileId))
  query.set('lang', String(localeCurrent.value || 'en'))
  query.set('app_name', collaboraAppName())
  query.set('view_mode', 'read')

  // Exakt wie web-app-external: POST mit Query-String, leerer Body
  const url = urlJoin(configStore.serverUrl, providerOpenUrl()) + '?' + query.toString()
  console.debug('[OfficeViewer] opening', resource.name, url)
  try {
    const resp = await clientService.httpAuthenticated.post(url, undefined, {
      validateStatus: () => true
    })
    if (seq !== openSeq) return

    if (resp.status !== 200) {
      if (resp.status === 425) {
        error.value = $gettext('File is being processed, try again shortly')
      } else {
        console.error('[OfficeViewer] open failed:', resp.status, resp.data?.message || resp.data)
        error.value = $gettext('Preview not available')
      }
      loading.value = false
      return
    }

    const appUrl: string = resp.data?.app_url
    const method: string = resp.data?.method
    if (!appUrl || !method) {
      console.error('[OfficeViewer] app server response without app_url/method', resp.data)
      error.value = $gettext('Preview not available')
      loading.value = false
      return
    }

    console.debug('[OfficeViewer] app_url ok', resource.name, 'method=' + method)
    if (method === 'POST') {
      const params: Record<string, string> = { ...(resp.data?.form_parameters || {}) }
      params['ui_defaults'] = uiDefaults()
      frameForm.value = { action: appUrl, params }
      loading.value = false
      submitForm()
    } else {
      frameUrl.value = appUrl
      loading.value = false
    }
  } catch (openErr: any) {
    if (seq !== openSeq) return
    console.error('[OfficeViewer] request failed:', openErr?.name, openErr?.message, openErr)
    error.value = $gettext('Preview not available')
    loading.value = false
  }
}

watch(() => props.resource, (resource) => {
  if (!resource?.name) {
    openSeq++
    frameUrl.value = ''
    frameForm.value = null
    error.value = ''
    loading.value = false
    return
  }
  void openOfficeDoc(resource, ++openSeq)
}, { immediate: true })

onBeforeUnmount(() => {
  openSeq++
})
</script>

<style scoped>
.office-viewer {
  position: relative;
  min-height: 200px;
}
.office-viewer-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 8px;
  gap: 8px;
}
.office-viewer-state-text {
  margin: 0;
  font-size: 13px;
  color: var(--oc-role-text-secondary, #666);
}
.office-viewer-loading {
  display: block;
  margin: 24px auto;
}
.office-viewer-frame {
  width: 100%;
  height: 600px;
  border: none;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
</style>
