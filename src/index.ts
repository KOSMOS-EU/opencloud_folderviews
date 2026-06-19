import { defineWebApplication, useClientService } from '@opencloud-eu/web-pkg'
import { computed, markRaw } from 'vue'
import { getAktenzeichenPreferenceDefinitions } from './composables/useFolderviewSettings'
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
      ...aktzDefs.extensions
    ])

    // Extension points: aktenzeichen preference
    const extensionPoints = computed(() => [aktzDefs.extensionPoint])

    // Register oy.fileReference as extra DAV property so it comes with every PROPFIND
    const clientService = useClientService()
    clientService.webdav.registerExtraProp('oc:oy.fileReference')

    console.log('[folderviews] setup complete')
    console.log('[folderviews] extensions:', extensions.value)
    console.log('[folderviews] extensionPoints:', extensionPoints.value)
    console.log('[folderviews] aktzDefs:', aktzDefs)

    return {
      appInfo,
      extensions,
      extensionPoints,
      folderViewHandlers
    }
  }
})
