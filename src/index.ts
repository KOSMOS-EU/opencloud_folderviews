import { defineWebApplication, useClientService } from '@opencloud-eu/web-pkg'
import { markRaw } from 'vue'
import { registerSettingsBundle, loadSettings } from './composables/useFolderviewSettings'
import AktenplanView from './views/AktenplanView.vue'
import AkteView from './views/AkteView.vue'
import VorgangView from './views/VorgangView.vue'
import RegisterView from './views/RegisterView.vue'
import ResourceTree from './components/ResourceTree.vue'
import ResourceMetro from './components/ResourceMetro.vue'

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

    // New list view modes (Tree + Metro) as FolderViewExtensions
    const extensions = [
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
      }
    ]

    // Register oy.fileReference as extra DAV property so it comes with every listFiles
    const clientService = useClientService()
    clientService.webdav.registerExtraProp('oc:oy.fileReference')

    // Register settings bundle and load user preferences
    registerSettingsBundle(clientService).then(() => loadSettings(clientService))

    return {
      appInfo,
      extensions,
      folderViewHandlers
    }
  }
})
