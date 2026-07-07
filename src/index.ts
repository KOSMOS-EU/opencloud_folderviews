import { defineWebApplication, useClientService, useSideBar, useResourcesStore, useRouter, useExtensionRegistry, useAuthStore, createFileRouteOptions, createLocationSpaces, AppWrapperRoute } from '@opencloud-eu/web-pkg'
import { useGettext } from 'vue3-gettext'
import { computed, markRaw, ref, watch } from 'vue'
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
import ResourceTagList from './components/ResourceTagList.vue'
import TypedFolderToolbar from './components/TypedFolderToolbar.vue'
import LearnEditor from './components/LearnEditor.vue'
import AppModeBar from './components/AppModeBar.vue'
import translations from '../l10n/translations.json'

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
      name: $gettext('Folder Views'),
      id: applicationId,
      icon: 'archive',
      color: '#5c6bc0',
      defaultExtension: 'viewtype',
      extensions: [
        {
          extension: 'viewtype',
          routeName: 'viewtype-editor',
          label: $gettext('Edit type schema'),
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
          label: $gettext('Tree view'),
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
          label: $gettext('Metro view'),
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
          label: $gettext('Element view'),
          icon: { name: 'layout-4', fillType: 'line' },
          component: markRaw(ResourceElements)
        }
      },
      {
        id: 'com.kosmos-eu.folderviews.folder-view.resource-tag-list',
        type: 'folderView',
        extensionPointIds: [
          'app.files.folder-views.folder',
          'app.files.folder-views.project-spaces'
        ],
        folderView: {
          name: 'resource-tag-list',
          label: $gettext('Tag search'),
          icon: { name: 'price-tag-3', fillType: 'line' },
          component: markRaw(ResourceTagList)
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
          title: () => $gettext('Folder settings'),
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
      // App mode bar: renders when ?appMode=true, hides sidebar/search
      // App mode: primary nav in topbar center (replaces search bar)
      {
        id: 'com.kosmos-eu.folderviews.app-mode-primary-nav',
        type: 'customComponent',
        extensionPointIds: ['app.runtime.appMode.primaryNav'],
        content: markRaw(AppModeBar)
      },
      // Space header: TypedFolderToolbar renders its own header when folder is typed,
      // otherwise passes through to SpaceHeader for normal folders
      {
        id: 'com.kosmos-eu.folderviews.space-header',
        type: 'customComponent',
        extensionPointIds: ['app.files.generic-space-header'],
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
          label: () => $gettext('Folder settings'),
          category: 'secondary',
          handler: () => {
            const sidebarStore = useSideBar()
            sidebarStore.openSideBarPanel('folder-settings')
          },
          isVisible: (options: any) => {
            const resource = options?.resources?.[0]
            if (!resource) return false
            if (resource.type !== 'folder' && resource.type !== 'space') return false
            if (options?.resources?.length !== 1) return false
            return true
          }
        }
      },
      // Leaf apps: register at app.folderviews.leaf-apps extension point
      // External extensions (e.g. mdm-editor) register the same way
      {
        id: 'com.kosmos-eu.folderviews.leaf-app.learn-editor',
        type: 'customComponent',
        extensionPointIds: ['app.folderviews.leaf-apps'],
        content: markRaw(LearnEditor),
        appName: 'learn-editor',
        appIcon: 'book-open'
      },
      {
        id: 'com.kosmos-eu.folderviews.leaf-app.viewtype-editor',
        type: 'customComponent',
        extensionPointIds: ['app.folderviews.leaf-apps'],
        content: markRaw(ViewTypeEditor),
        appName: 'viewtype-editor',
        appIcon: 'settings-3'
      },
      // Context menu action: navigate to .views/ folder (Ordnertypen)
      {
        id: 'com.kosmos-eu.folderviews.action.folder-types',
        type: 'action',
        extensionPointIds: ['global.files.context-actions'],
        action: {
          name: 'folder-types',
          icon: 'layout-grid',
          label: () => $gettext('Folder types'),
          category: 'secondary',
          handler: (options: any) => {
            const resource = options?.resources?.[0]
            // If the resource is a space itself, use it as the space; otherwise use options.space
            const space = resource?.type === 'space' ? resource : options?.space
            if (!space) return
            const { params, query } = createFileRouteOptions(space, { path: '.views' })
            router.push(createLocationSpaces('files-spaces-generic', {
              params,
              query: { ...query, 'view-mode': 'resource-metro' }
            }))
          },
          isVisible: (options: any) => {
            if (!options?.resources?.length) return false
            const r = options.resources[0]
            return r.type === 'space' && options.resources.length === 1
          }
        }
      }
    ])

    // Extension points
    const leafAppExtensionPoint = {
      id: 'app.folderviews.leaf-apps',
      extensionType: 'customComponent' as const,
      multiple: true
    }

    const extensionPoints = computed(() => [
      aktzDefs.extensionPoint,
      leafAppExtensionPoint
    ])

    const router = useRouter()

    // Register oy.* metadata as extra DAV properties (come in PROPFIND, no extra API calls)
    const clientService = useClientService()
    clientService.webdav.registerExtraProp('oc:oy.fileReference')
    clientService.webdav.registerExtraProp('oc:oy.color')
    clientService.webdav.registerExtraProp('oc:oy.note')
    clientService.webdav.registerExtraProp('oc:oy.app')
    clientService.webdav.registerExtraProp('oc:oy.ftype')

    // Space Apps: load from server and register as appMenuItem extensions
    interface SpaceApp {
      spaceId: string
      spaceName: string
      driveAlias?: string
      driveType?: string
      name: string
      icon?: string
      color?: string
      menu?: any[]
    }

    const spaceApps = ref<SpaceApp[]>([])

    // Load space apps after authentication
    const authStore = useAuthStore()
    const loadSpaceApps = () => {
      const httpClient = (clientService as any).httpAuthenticated
      if (!httpClient) return
      httpClient.get('/graph/v1beta1/extensions/apps')
        .then((res: any) => {
          const apps = res?.data?.apps || []
          if (apps.length > 0) {
            spaceApps.value = apps;
            (window as any).__spaceApps = apps
          }
        })
        .catch(() => { /* server may not support apps endpoint */ })
    }
    watch(() => authStore.userContextReady, (ready) => {
      if (ready) loadSpaceApps()
    }, { immediate: true })

    const spaceAppExtensions = computed(() =>
      spaceApps.value.map(app => ({
        id: `com.kosmos-eu.folderviews.space-app.${app.spaceId}`,
        type: 'appMenuItem' as const,
        label: () => app.name,
        icon: app.icon || 'grid',
        color: app.color,
        handler: () => {
          const alias = app.driveAlias || `project/${app.spaceName.toLowerCase().replace(/\s+/g, '-')}`
          router.push({
            path: `/files/spaces/${alias}`,
            query: { appMode: 'true', 'view-mode': 'resource-metro' }
          })
        }
      }))
    )

    const allExtensions = computed(() => [
      ...extensions.value,
      ...spaceAppExtensions.value
    ])

    return {
      appInfo,
      routes,
      translations,
      extensions: allExtensions,
      extensionPoints,
      folderViewHandlers
    }
  }
})
