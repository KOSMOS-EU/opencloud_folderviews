import { defineWebApplication, useClientService } from '@opencloud-eu/web-pkg'
import { computed, markRaw } from 'vue'
import { getAktenzeichenPreferenceDefinitions } from './composables/useFolderviewSettings'
import AktenplanView from './views/AktenplanView.vue'
import AkteView from './views/AkteView.vue'
import VorgangView from './views/VorgangView.vue'
import RegisterView from './views/RegisterView.vue'
import ResourceTree from './components/ResourceTree.vue'
import ResourceMetro from './components/ResourceMetro.vue'
import ResourceElements from './components/ResourceElements.vue'

const applicationId = 'folderviews'

export default defineWebApplication({
  setup() {
    const appInfo = {
      name: 'Folder Views',
      id: applicationId,
      icon: 'archive',
      color: '#5c6bc0',
      defaultExtension: '',
      extensions: [] as any[]
    }

    // Typed FolderView handlers keyed by _type_ name
    const folderViewHandlers = {
      aktenplan: markRaw(AktenplanView),
      akte: markRaw(AkteView),
      vorgang: markRaw(VorgangView),
      register: markRaw(RegisterView)
    }

    // Aktenzeichen user preference (checkbox on /account/extensions)
    const aktzDefs = getAktenzeichenPreferenceDefinitions()

    // Extensions: folder views + aktenzeichen preference toggle
    const extensions = computed(() => [
      {
        id: 'com.kosmos-eu.folderviews.folder-view.resource-tree',
        type: 'folderView',
        extensionPointIds: [
          'app.files.folder-views.folder',
          'app.files.folder-views.project-spaces'
        ],
        folderView: {
          name: 'resource-tree',
          label: 'Tree view',
          icon: { name: 'node-tree', fillType: 'none' },
          component: markRaw(ResourceTree)
        }
      },
      {
        id: 'com.kosmos-eu.folderviews.folder-view.resource-metro',
        type: 'folderView',
        extensionPointIds: [
          'app.files.folder-views.folder',
          'app.files.folder-views.project-spaces'
        ],
        folderView: {
          name: 'resource-metro',
          label: 'Metro tiles view',
          icon: { name: 'dashboard', fillType: 'fill' },
          component: markRaw(ResourceMetro)
        }
      },
      {
        id: 'com.kosmos-eu.folderviews.folder-view.resource-elements',
        type: 'folderView',
        extensionPointIds: [
          'app.files.folder-views.folder',
          'app.files.folder-views.project-spaces'
        ],
        folderView: {
          name: 'resource-elements',
          label: 'Element view',
          icon: { name: 'layout-4', fillType: 'line' },
          component: markRaw(ResourceElements)
        }
      },
      ...aktzDefs.extensions
    ])

    // Extension points: aktenzeichen preference
    const extensionPoints = computed(() => [aktzDefs.extensionPoint])

    // Register oy.* metadata as extra DAV properties (come in PROPFIND, no extra API calls)
    const clientService = useClientService()
    clientService.webdav.registerExtraProp('oc:oy.fileReference')
    clientService.webdav.registerExtraProp('oc:oy.color')
    clientService.webdav.registerExtraProp('oc:oy.note')

    return {
      appInfo,
      extensions,
      extensionPoints,
      folderViewHandlers
    }
  }
})
