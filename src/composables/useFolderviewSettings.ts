import { ref, readonly } from 'vue'
import { useClientService } from '@opencloud-eu/web-pkg'

const BUNDLE_ID = 'e8a5b2c1-4f3d-4a1e-9b7c-2d6f8e3a1b5c'
const SETTING_AKTZ_IN_NAME = 'show-aktenzeichen-in-name'
const BUNDLE_EXTENSION = 'folderviews'

export interface FolderviewSettings {
  showAktzInName: boolean
}

const settingsLoaded = ref(false)
const showAktzInName = ref(false)

/**
 * Registers the folderviews settings bundle with the OpenCloud settings service.
 * Called once on app init. Idempotent — SaveBundle updates if already exists.
 */
export async function registerSettingsBundle(clientService: ReturnType<typeof useClientService>) {
  try {
    await clientService.httpAuthenticated.post('/api/v0/settings/bundle-save', {
      bundle: {
        id: BUNDLE_ID,
        name: 'folderviews',
        extension: BUNDLE_EXTENSION,
        type: 'TYPE_DEFAULT',
        displayName: 'Folder Views',
        resource: { type: 'TYPE_USER' },
        settings: [
          {
            id: '1a2b3c4d-5e6f-7a8b-9c0d-e1f2a3b4c5d6',
            name: SETTING_AKTZ_IN_NAME,
            displayName: 'Aktenzeichen im Ordnernamen',
            description: 'Aktenzeichen (z.B. 11.12.01) vor dem Ordnernamen anzeigen',
            resource: { type: 'TYPE_USER' },
            value: {
              boolValue: {
                default: false,
                label: 'Aktenzeichen anzeigen'
              }
            }
          }
        ]
      }
    })
  } catch (e) {
    console.debug('[folderviews] settings bundle registration skipped:', e)
  }
}

/**
 * Loads the current user's folderviews settings.
 */
export async function loadSettings(clientService: ReturnType<typeof useClientService>) {
  if (settingsLoaded.value) return

  try {
    const { data } = await clientService.httpAuthenticated.post(
      '/api/v0/settings/values-get-by-unique-identifiers',
      {
        identifiers: [
          {
            extension: BUNDLE_EXTENSION,
            bundle: 'folderviews',
            setting: SETTING_AKTZ_IN_NAME
          }
        ]
      }
    )
    const values = data?.values || []
    for (const v of values) {
      if (v?.identifier?.setting === SETTING_AKTZ_IN_NAME) {
        showAktzInName.value = v.value?.boolValue ?? false
      }
    }
  } catch (e) {
    console.debug('[folderviews] could not load settings:', e)
  }

  settingsLoaded.value = true
}

/**
 * Saves the showAktzInName setting for the current user.
 */
export async function saveShowAktzInName(
  clientService: ReturnType<typeof useClientService>,
  value: boolean
) {
  showAktzInName.value = value
  try {
    await clientService.httpAuthenticated.post('/api/v0/settings/values-save', {
      value: {
        bundleId: BUNDLE_ID,
        settingId: '1a2b3c4d-5e6f-7a8b-9c0d-e1f2a3b4c5d6',
        resource: { type: 'TYPE_USER' },
        boolValue: value
      }
    })
  } catch (e) {
    console.error('[folderviews] could not save setting:', e)
  }
}

export function useFolderviewSettings() {
  return {
    showAktzInName: readonly(showAktzInName),
    settingsLoaded: readonly(settingsLoaded)
  }
}
