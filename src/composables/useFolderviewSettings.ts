import { computed } from 'vue'
import { useExtensionPreferencesStore } from '@opencloud-eu/web-pkg'

// --- Aktenzeichen ---
const AKTZ_EP = 'com.kosmos-eu.folderviews.aktenzeichen-display'
const AKTZ_ENABLED = 'com.kosmos-eu.folderviews.aktenzeichen-enabled'
const AKTZ_DISABLED = 'com.kosmos-eu.folderviews.aktenzeichen-disabled'

// --- App Compact ---
const COMPACT_EP = 'com.kosmos-eu.folderviews.app-compact'
const COMPACT_ENABLED = 'com.kosmos-eu.folderviews.app-compact-enabled'
const COMPACT_DISABLED = 'com.kosmos-eu.folderviews.app-compact-disabled'

// --- New Window ---
const NEWWIN_EP = 'com.kosmos-eu.folderviews.app-new-window'
const NEWWIN_ENABLED = 'com.kosmos-eu.folderviews.app-new-window-enabled'
const NEWWIN_DISABLED = 'com.kosmos-eu.folderviews.app-new-window-disabled'

/**
 * Returns all extension points + extensions for user preferences.
 */
export function getPreferenceDefinitions() {
  const extensionPoints = [
    {
      id: AKTZ_EP,
      extensionType: 'customComponent' as const,
      multiple: false,
      defaultExtensionId: AKTZ_DISABLED,
      userPreference: {
        label: 'Aktenzeichen im Ordnernamen',
        description: 'Aktenzeichen (z.B. 11.12.01) vor dem Ordnernamen anzeigen',
        type: 'checkbox' as const
      }
    },
    {
      id: COMPACT_EP,
      extensionType: 'customComponent' as const,
      multiple: false,
      defaultExtensionId: COMPACT_ENABLED,
      userPreference: {
        label: 'Apps kompakt öffnen',
        description: 'Externe Apps (z.B. Collabora) ohne Navigationsleiste öffnen',
        type: 'checkbox' as const
      }
    },
    {
      id: NEWWIN_EP,
      extensionType: 'customComponent' as const,
      multiple: false,
      defaultExtensionId: NEWWIN_ENABLED,
      userPreference: {
        label: 'Datei in neuem Fenster öffnen',
        description: 'Externe Apps in einem separaten Browserfenster öffnen',
        type: 'checkbox' as const
      }
    }
  ]

  const extensions = [
    {
      id: AKTZ_ENABLED,
      type: 'customComponent' as const,
      extensionPointIds: [AKTZ_EP],
      userPreference: { optionLabel: 'Aktenzeichen anzeigen' }
    },
    {
      id: AKTZ_DISABLED,
      type: 'customComponent' as const,
      extensionPointIds: [AKTZ_EP],
      userPreference: { optionLabel: 'Aktenzeichen ausblenden' }
    },
    {
      id: COMPACT_ENABLED,
      type: 'customComponent' as const,
      extensionPointIds: [COMPACT_EP],
      userPreference: { optionLabel: 'Kompakt' }
    },
    {
      id: COMPACT_DISABLED,
      type: 'customComponent' as const,
      extensionPointIds: [COMPACT_EP],
      userPreference: { optionLabel: 'Normal' }
    },
    {
      id: NEWWIN_ENABLED,
      type: 'customComponent' as const,
      extensionPointIds: [NEWWIN_EP],
      userPreference: { optionLabel: 'Neues Fenster' }
    },
    {
      id: NEWWIN_DISABLED,
      type: 'customComponent' as const,
      extensionPointIds: [NEWWIN_EP],
      userPreference: { optionLabel: 'Gleiches Fenster' }
    }
  ]

  return { extensionPoints, extensions }
}

// Keep old name for backward compat (index.ts imports it)
export const getAktenzeichenPreferenceDefinitions = () => {
  const defs = getPreferenceDefinitions()
  return {
    extensionPoint: defs.extensionPoints[0],
    extensions: defs.extensions
  }
}

/**
 * Composable to read all user preferences.
 */
export function useFolderviewSettings() {
  const store = useExtensionPreferencesStore()

  const showAktzInName = computed(() => {
    const pref = store.getExtensionPreference(AKTZ_EP, [AKTZ_DISABLED])
    return !pref.selectedExtensionIds.includes(AKTZ_ENABLED)
  })

  const userAppCompact = computed(() => {
    const pref = store.getExtensionPreference(COMPACT_EP, [COMPACT_DISABLED])
    return pref.selectedExtensionIds.includes(COMPACT_ENABLED)
  })

  const userAppNewWindow = computed(() => {
    const pref = store.getExtensionPreference(NEWWIN_EP, [NEWWIN_DISABLED])
    return pref.selectedExtensionIds.includes(NEWWIN_ENABLED)
  })

  // Debug helper — remove after testing
  ;(window as any).__fvSettings = () => ({
    compact: userAppCompact.value,
    newWindow: userAppNewWindow.value
  })

  return { showAktzInName, userAppCompact, userAppNewWindow }
}
