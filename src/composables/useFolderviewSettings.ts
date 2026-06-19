import { computed } from 'vue'
import { useExtensionPreferencesStore } from '@opencloud-eu/web-pkg'

const EXTENSION_POINT_ID = 'com.kosmos-eu.folderviews.aktenzeichen-display'
const EXT_ENABLED = 'com.kosmos-eu.folderviews.aktenzeichen-enabled'
const EXT_DISABLED = 'com.kosmos-eu.folderviews.aktenzeichen-disabled'

/**
 * Returns the extension point + extensions to register in index.ts
 */
export function getAktenzeichenPreferenceDefinitions() {
  const extensionPoint = {
    id: EXTENSION_POINT_ID,
    extensionType: 'customComponent' as const,
    multiple: false,
    defaultExtensionId: EXT_DISABLED,
    userPreference: {
      label: 'Aktenzeichen im Ordnernamen',
      description: 'Aktenzeichen (z.B. 11.12.01) vor dem Ordnernamen anzeigen',
      type: 'checkbox' as const
    }
  }

  const extensions = [
    {
      id: EXT_ENABLED,
      type: 'customComponent' as const,
      extensionPointIds: [EXTENSION_POINT_ID],
      userPreference: { optionLabel: 'Aktenzeichen anzeigen' }
    },
    {
      id: EXT_DISABLED,
      type: 'customComponent' as const,
      extensionPointIds: [EXTENSION_POINT_ID],
      userPreference: { optionLabel: 'Aktenzeichen ausblenden' }
    }
  ]

  return { extensionPoint, extensions }
}

/**
 * Composable to read the user's Aktenzeichen preference.
 * Uses the extension preferences store (localStorage-backed).
 */
export function useFolderviewSettings() {
  const store = useExtensionPreferencesStore()

  const showAktzInName = computed(() => {
    const pref = store.getExtensionPreference(EXTENSION_POINT_ID, [EXT_DISABLED])
    return !pref.selectedExtensionIds.includes(EXT_ENABLED)
  })

  return { showAktzInName }
}
