import { defineWebApplication, useClientService, useSideBar, useResourcesStore, useRouter, createFileRouteOptions, createLocationSpaces, AppWrapperRoute } from '@opencloud-eu/web-pkg'
import { useGettext } from 'vue3-gettext'
import { computed, markRaw } from 'vue'
import ViewTypeEditor from './components/ViewTypeEditor.vue'
import FolderSettingsPanel from './components/FolderSettingsPanel.vue'
import { getAktenzeichenPreferenceDefinitions } from './composables/useFolderviewSettings'
import AktenplanView from './views/AktenplanView.vue'
import AkteView from './views/AkteView.vue'
import VorgangView from './views/VorgangView.vue'
import RegisterView from './views/RegisterView.vue'
import ResourceTree from './components/ResourceTree.vue'
import ResourceMetro from './components/ResourceMetro.vue'
import ResourceElements from './components/ResourceElements.vue'
import TypedFolderToolbar from './components/TypedFolderToolbar.vue'

const applicationId = 'folderviews'

export default defineWebApplication({
  setup() {
    const { $gettext } = useGettext()

    const routes = [
      {
        name: 'viewtype-editor',
        path: '/:driveAliasAndItem(.*)?',
        component: AppWrapperRoute(ViewTypeEditor, { applicationId }),
        meta: {
          authContext: 'hybrid',
          patchCleanPath: true
        }
      }
    ]

    const appInfo = {
      name: $gettext('Ordneransichten'),
      id: applicationId,
      icon: 'archive',
      color: '#5c6bc0',
      defaultExtension: 'viewtype',
      extensions: [
        {
          extension: 'viewtype',
          routeName: 'viewtype-editor',
          label: $gettext('Typ-Schema bearbeiten'),
          icon: 'settings-3',
          newFileMenu: false
        }
      ]
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
          label: $gettext('Baumansicht'),
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
          label: $gettext('Kachelansicht'),
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
          label: $gettext('Elementansicht'),
          icon: { name: 'layout-4', fillType: 'line' },
          component: markRaw(ResourceElements)
        }
      },
      ...aktzDefs.extensions,
      // Folder Settings sidebar panel
      {
        id: 'com.kosmos-eu.folderviews.sidebar-panel.folder-settings',
        type: 'sidebarPanel',
        extensionPointIds: ['global.files.sidebar'],
        panel: {
          name: 'folder-settings',
          icon: 'settings-3',
          title: () => 'Ordner-Einstellungen',
          component: markRaw(FolderSettingsPanel),
          componentAttrs: (context: any) => ({
            space: context?.root,
            resource: context?.items?.[0]
          }),
          isRoot: () => false,
          isVisible: (context: any) => {
            if (context?.items?.length !== 1) return false
            return context.items[0]?.type === 'folder'
          }
        }
      },
      // Space header: replace default SpaceHeader when folder has a _type_ marker
      {
        id: 'com.kosmos-eu.folderviews.space-header',
        type: 'customComponent',
        extensionPointIds: ['app.files.space-header'],
        content: markRaw(TypedFolderToolbar)
      },
      // Context menu action to open the sidebar panel
      {
        id: 'com.kosmos-eu.folderviews.action.folder-settings',
        type: 'action',
        extensionPointIds: ['global.files.context-actions'],
        action: {
          name: 'folder-settings',
          icon: 'settings-3',
          label: () => 'Ordner-Einstellungen',
          category: 'secondary',
          handler: () => {
            const sidebarStore = useSideBar()
            sidebarStore.openSideBarPanel('folder-settings')
          },
          isVisible: (options: any) => {
            const resource = options?.resources?.[0]
            if (!resource || resource.type !== 'folder') return false
            if (options?.resources?.length !== 1) return false
            return true
          }
        }
      },
      // Context menu action: navigate to .views/ folder (Ordnertypen)
      {
        id: 'com.kosmos-eu.folderviews.action.folder-types',
        type: 'action',
        extensionPointIds: ['global.files.context-actions'],
        action: {
          name: 'folder-types',
          icon: 'layout-grid',
          label: () => $gettext('Ordnertypen'),
          category: 'secondary',
          handler: (options: any) => {
            const space = options?.space
            if (!space) return
            const routeOpts = createFileRouteOptions(space, { path: '.views' })
            router.push(createLocationSpaces('files-spaces-generic', routeOpts))
          },
          isVisible: (options: any) => {
            if (!options?.resources?.length) return false
            const r = options.resources[0]
            // Show on folders (any folder in a space)
            return r.type === 'folder' && options.resources.length === 1
          }
        }
      }
    ])

    // Extension points: aktenzeichen preference
    const extensionPoints = computed(() => [aktzDefs.extensionPoint])

    const router = useRouter()

    // Register oy.* metadata as extra DAV properties (come in PROPFIND, no extra API calls)
    const clientService = useClientService()
    clientService.webdav.registerExtraProp('oc:oy.fileReference')
    clientService.webdav.registerExtraProp('oc:oy.color')
    clientService.webdav.registerExtraProp('oc:oy.note')
    clientService.webdav.registerExtraProp('oc:oy.app')

    return {
      appInfo,
      routes,
      extensions,
      extensionPoints,
      folderViewHandlers
    }
  }
})
