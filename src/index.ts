import { defineWebApplication, useClientService, useSideBar, useResourcesStore, useSpacesStore, useRouter, useExtensionRegistry, useAuthStore, useAppsStore, createFileRouteOptions, createLocationSpaces, AppWrapperRoute, useModals, useMessages } from '@opencloud-eu/web-pkg'
import { useGettext } from 'vue3-gettext'
import { computed, markRaw, ref, watch, nextTick, h } from 'vue'
import { WebDAV } from '@opencloud-eu/web-client/webdav'
import { dirname, join } from 'path'
import ViewTypeEditor from './components/ViewTypeEditor.vue'
import FolderSettingsPanel from './components/FolderSettingsPanel.vue'
import { getPreferenceDefinitions, useFolderviewSettings, registerAktzSortToggle } from './composables/useFolderviewSettings'
import { prefixResources, getFileReference } from './composables/useFileReference'
import RenameAzModal from './components/RenameAzModal.vue'
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
import { useAppModeStore } from './composables/useAppModeStore'
import { useAppMenuStore } from './composables/useAppMenuStore'
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

    // User preferences (checkboxes on /account/extensions)
    const prefDefs = getPreferenceDefinitions()
    const { showAktzInName, userAppCompact, userAppNewWindow, ignoreAktzSort } = useFolderviewSettings()
    registerAktzSortToggle(ignoreAktzSort, showAktzInName)

    function downloadUrlFile(fileName: string, url: string) {
      const isLinux = /Linux/.test(navigator.userAgent)
      const isMac = /Mac/.test(navigator.userAgent)

      let content: string
      let ext: string
      let mime: string

      if (isLinux) {
        content = `[Desktop Entry]\nType=Link\nName=${fileName}\nURL=${url}\nIcon=text-x-generic\n`
        ext = 'desktop'
        mime = 'application/x-desktop'
      } else if (isMac) {
        content = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>URL</key><string>${url}</string></dict></plist>`
        ext = 'webloc'
        mime = 'application/xml'
      } else {
        content = `[InternetShortcut]\r\nURL=${url}\r\n`
        ext = 'url'
        mime = 'application/internet-shortcut'
      }

      const blob = new Blob([content], { type: mime })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${fileName}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    }

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
      ...prefDefs.extensions,
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
      },
      // Pin: download a .url shortcut file pointing to the document in compact app mode
      {
        id: 'com.kosmos-eu.folderviews.action.pin-to-desktop',
        type: 'action',
        extensionPointIds: ['global.files.context-actions'],
        action: {
          name: 'pin-to-desktop',
          icon: 'pushpin',
          label: () => 'Pin',
          category: 'secondary',
          handler: (options: any) => {
            try {
              const resource = options?.resources?.[0]
              const space = options?.space
              if (!resource || !space) return

              const driveAliasAndItem = space.getDriveAliasAndItem(resource)
              const fileId = resource.fileId
              if (!driveAliasAndItem || !fileId) return

              // Find the editor route for this file extension
              const appsStore = useAppsStore()
              const ext = resource.extension?.toLowerCase()
              const match = appsStore.fileExtensions.find(
                (fe: any) => fe.extension?.toLowerCase() === ext && fe.hasPriority
              ) || appsStore.fileExtensions.find(
                (fe: any) => fe.extension?.toLowerCase() === ext
              )
              const routeName = match?.routeName || match?.app
              if (!routeName) return

              const href = router.resolve({
                name: routeName,
                params: { driveAliasAndItem },
                query: { fileId, appCompact: 'true' }
              }).href

              downloadUrlFile(resource.name, window.location.origin + href)
            } catch (e) {
              console.error('[Pin] error:', e)
            }
          },
          isVisible: (options: any) => {
            if (!options?.resources?.length || options.resources.length !== 1) return false
            const r = options.resources[0]
            return r.type === 'file'
          }
        }
      },
      // Rename action: AZ-aware rename when prefix mode is active
      {
        id: 'com.kosmos-eu.folderviews.action.rename-az',
        type: 'action',
        extensionPointIds: ['global.files.context-actions'],
        action: {
          name: 'rename',  // same name = overrides built-in rename
          icon: 'pencil',
          label: () => $gettext('Rename'),
          handler: (options: any) => {
            const resource = options?.resources?.[0]
            if (!resource) return

            const parentAz = (resource as any).extraProps?.['om:parent-oy.fileReference'] || ''
            const fullAz = getFileReference(resource)
            const originalName = (resource as any)._originalName || resource.name || ''

            // If AZ mode active and resource has parent AZ → show AZ rename modal
            if (showAktzInName.value && parentAz) {
              const azRest = fullAz.startsWith(parentAz) ? fullAz.slice(parentAz.length) : fullAz

              const modalRef = ref<any>(null)
              let isValid = true

              const { dispatchModal } = useModals()
              const { showErrorMessage } = useMessages()

              dispatchModal({
                title: $gettext('Rename'),
                confirmText: $gettext('Rename'),
                customContent: markRaw({
                  render() {
                    return h(RenameAzModal, {
                      ref: (el: any) => { modalRef.value = el },
                      resource,
                      parentAz,
                      initialAzRest: azRest,
                      initialName: originalName,
                      onValidate: (v: boolean) => { isValid = v }
                    })
                  }
                }),
                async onConfirm() {
                  if (!isValid || !modalRef.value) return
                  const { fileName, fileReference } = modalRef.value.getValues()
                  const space = options.space

                  try {
                    // 1. Rename file if name changed
                    if (fileName !== originalName) {
                      const newPath = join(dirname(resource.path), fileName)
                      await (clientService.webdav as WebDAV).moveFiles(space, resource, space, { path: newPath })
                    }

                    // 2. Update fileReference if changed
                    if (fileReference !== fullAz) {
                      const httpClient = (clientService as any).httpAuthenticated
                      if (httpClient) {
                        const itemId = `${space.id}!${resource.id.split('!').pop()}`
                        await httpClient.put(
                          `/graph/v1beta1/drives/${space.id}/items/${itemId}/metadata`,
                          { 'oy.fileReference': fileReference }
                        )
                      }
                    }

                    // 3. Reload listing
                    const resourcesStore = useResourcesStore()
                    const { children } = await clientService.webdav.listFiles(space, { path: dirname(resource.path) })
                    for (const child of children) {
                      resourcesStore.upsertResource(child)
                    }
                  } catch (error: any) {
                    console.error(error)
                    showErrorMessage({
                      title: $gettext('Failed to rename "%{file}"', { file: originalName }),
                      errors: [error]
                    })
                  }
                }
              })
              return
            }

            // Fallback: no AZ context → let built-in rename handle it
            // Trigger built-in rename by dispatching standard modal
            const { dispatchModal } = useModals()
            const resourcesStore = useResourcesStore()
            const areFileExtensionsShown = resourcesStore.areFileExtensionsShown
            const nameWithoutExt = resource.isFolder || areFileExtensionsShown
              ? originalName
              : originalName.replace(/\.[^.]+$/, '')

            dispatchModal({
              title: resource.isFolder
                ? $gettext('Rename folder »%{name}«', { name: nameWithoutExt })
                : $gettext('Rename file »%{name}«', { name: nameWithoutExt }),
              confirmText: $gettext('Rename'),
              hasInput: true,
              inputValue: nameWithoutExt,
              inputLabel: resource.isFolder ? $gettext('Folder name') : $gettext('File name'),
              async onConfirm(newName: string) {
                if (!areFileExtensionsShown && !resource.isFolder) {
                  const ext = originalName.match(/\.[^.]+$/)?.[0] || ''
                  newName = newName + ext
                }
                try {
                  const newPath = join(dirname(resource.path), newName)
                  await (clientService.webdav as WebDAV).moveFiles(options.space, resource, options.space, { path: newPath })
                  const updated = { ...resource }
                  updated.name = newName
                  updated.path = newPath
                  resourcesStore.upsertResource(updated)
                } catch (error: any) {
                  console.error(error)
                  const { showErrorMessage } = useMessages()
                  showErrorMessage({
                    title: $gettext('Failed to rename "%{file}"', { file: originalName }),
                    errors: [error]
                  })
                }
              }
            })
          },
          isVisible: (options: any) => {
            if (!options?.resources?.length || options.resources.length !== 1) return false
            const r = options.resources[0]
            if (r.locked || r.processing) return false
            return r.canRename?.() !== false
          }
        }
      },
      // Resource transformer: prefix resource names with Aktenzeichen (if user pref enabled)
      {
        id: 'com.kosmos-eu.folderviews.resource-transformer.aktenzeichen',
        type: 'resourceTransformer',
        extensionPointIds: ['global.files.resource-transformer'],
        transformResources(resources: any[]) {
          if (!showAktzInName.value) return resources
          return prefixResources(resources)
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
      ...prefDefs.extensionPoints,
      leafAppExtensionPoint
    ])

    const router = useRouter()
    const appModeStore = useAppModeStore()
    const appMenuStore = useAppMenuStore()

    // App Mode: preserve query params within app space, disable when leaving
    router.beforeEach((to, from) => {
      if (!appModeStore.isEnabled) return
      // Leaving the app space → disable app mode, strip app-mode query params
      if (appModeStore.spaceAlias && !to.path.includes(appModeStore.spaceAlias)) {
        appModeStore.disable()
        const clean = { ...to.query }
        delete clean['appMode']
        delete clean['view-mode']
        delete clean['tiles-size']
        return { ...to, query: clean }
      }
      // Within app space → preserve query params
      const needed = ['appMode', 'view-mode', 'tiles-size']
      const missing = needed.filter(k => from.query[k] && !to.query[k])
      if (missing.length > 0) {
        const merged = { ...to.query }
        for (const k of missing) merged[k] = from.query[k] as string
        return { ...to, query: merged }
      }
    })

    // App Compact + New Window: intercept navigation to external-* app routes
    router.beforeEach((to, from) => {
      const routeName = String(to.name || '')
      if (!routeName.startsWith('external-') &&
          !routeName.includes('viewer') &&
          !routeName.includes('editor')) return
      // Already opened in compact/new window — don't intercept again
      if (to.query.appCompact) return

      if (!userAppCompact.value && !userAppNewWindow.value) return

      const query = { ...to.query }
      if (userAppCompact.value) query.appCompact = 'true'

      if (userAppNewWindow.value) {
        const resolved = router.resolve({ ...to, query })
        console.error('[FOLDERVIEWS] window.open:', resolved.href, '_blank', 'menubar=no,toolbar=no,location=no,status=no')
        window.open(resolved.href, '_blank', 'menubar=no,toolbar=no,location=no,status=no')
        return { path: from.path, query: from.query }
      }

      return { ...to, query }
    })

    // Register oy.* metadata as extra DAV properties via om: namespace
    // (come in PROPFIND/search, no extra API calls — reva resolves from xattrs)
    const clientService = useClientService()
    clientService.webdav.registerExtraProp('om:oy.fileReference')
    clientService.webdav.registerExtraProp('om:oy.color')
    clientService.webdav.registerExtraProp('om:oy.note')
    clientService.webdav.registerExtraProp('om:oy.app')
    clientService.webdav.registerExtraProp('om:oy.ftype')
    clientService.webdav.registerExtraProp('om:parent-oy.fileReference')

    // Space Apps: load from server and register as appMenuItem extensions
    interface SpaceApp {
      spaceId: string
      spaceName: string
      driveAlias?: string
      driveType?: string
      name: string
      icon?: string
      color?: string
      defaultView?: string
      defaultPath?: string
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
          appModeStore.disable()
          const alias = app.driveAlias || `project/${app.spaceName.toLowerCase().replace(/\s+/g, '-')}`
          const subPath = app.defaultPath || ''
          const query: Record<string, string> = {}
          if (app.defaultView) query['view-mode'] = app.defaultView
          if (app.menu?.length) {
            appModeStore.enable(app, alias)
            query['appMode'] = 'true'
            if (!query['view-mode']) query['view-mode'] = 'resource-metro'
          }
          router.push({
            path: `/files/spaces/${alias}${subPath}`,
            query
          })
        }
      }))
    )

    // Navigate to space with view-mode: two-step push (reset) + replace (set view)
    // Single push doesn't work because useRouteQuery setters restore old params
    const navigateWithView = (path: string, viewMode: string) => {
      appModeStore.disable()
      router.push({ path, query: {} }).catch(() => {}).finally(() => {
        setTimeout(() => router.replace({ path, query: { 'view-mode': viewMode } }), 50)
      })
    }

    const filesMenuItem = {
      id: 'com.kosmos-eu.folderviews.files-menu-item',
      type: 'appMenuItem' as const,
      label: () => $gettext('Files'),
      icon: 'folder-6',
      color: 'var(--oc-role-secondary)',
      priority: 10,
      handler: () => {
        const spacesStore = useSpacesStore()
        const personal = spacesStore.personalSpace
        const alias = personal?.driveAlias || 'personal/home'
        navigateWithView(`/files/spaces/${alias}`, 'resource-table')
      }
    }

    const intranetMenuItem = {
      id: 'com.kosmos-eu.folderviews.intranet-menu-item',
      type: 'appMenuItem' as const,
      label: () => 'Intranet',
      icon: 'global',
      color: '#1565C0',
      priority: 20,
      handler: () => navigateWithView('/files/spaces/project/intranet', 'resource-elements')
    }

    const mdmMenuItem = {
      id: 'com.kosmos-eu.folderviews.mdm-menu-item',
      type: 'appMenuItem' as const,
      label: () => 'MDM',
      icon: 'smartphone',
      color: '#2E7D32',
      priority: 30,
      handler: () => navigateWithView('/files/spaces/project/mdm', 'resource-metro')
    }

    // Build appMenuItems from registered entries (via useAppMenuStore)
    const registeredMenuItems = computed(() =>
      appMenuStore.items.map(entry => ({
        id: `com.kosmos-eu.folderviews.registered.${entry.spaceAlias}`,
        type: 'appMenuItem' as const,
        label: () => entry.label,
        icon: entry.icon,
        color: entry.color,
        priority: entry.priority || 50,
        handler: () => {
          if (entry.appMode) {
            appModeStore.enable({
              spaceId: '',
              spaceName: entry.label,
              driveAlias: entry.spaceAlias,
              driveType: 'project',
              name: entry.label,
              icon: entry.icon,
              color: entry.color
            }, entry.spaceAlias)
          }
          if (entry.routeName) {
            router.push({
              name: entry.routeName,
              params: { driveAliasAndItem: entry.spaceAlias },
              query: entry.appMode ? { appMode: 'true' } : {}
            })
          } else {
            const query: Record<string, string> = {}
            if (entry.appMode) query['appMode'] = 'true'
            if (entry.defaultView) query['view-mode'] = entry.defaultView
            router.push({ path: `/files/spaces/${entry.spaceAlias}`, query })
          }
        }
      }))
    )

    const allExtensions = computed(() => {
      const spacesStore = useSpacesStore()
      const hasMdmSpace = spacesStore.spaces.some(
        (s: any) => s.name?.toLowerCase() === 'mdm'
      )
      return [
        ...extensions.value,
        ...spaceAppExtensions.value,
        ...registeredMenuItems.value,
        filesMenuItem,
        intranetMenuItem,
        ...(hasMdmSpace ? [mdmMenuItem] : [])
      ]
    })

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
