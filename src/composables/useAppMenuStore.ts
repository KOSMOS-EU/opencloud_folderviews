import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * App Menu Store — allows extensions to register menu items.
 * Shared via Pinia singleton across all extensions (same store ID = same instance).
 *
 * Usage from any extension:
 *   import { defineStore } from 'pinia'
 *   const useAppMenuStore = defineStore('appMenu', () => { ... })
 *   // or simply re-declare with the same ID
 *   const store = useAppMenuStore()
 *   store.register({ label: 'My App', icon: 'grid', spaceAlias: 'project/my-app', appMode: true })
 */
export interface AppMenuEntry {
  label: string
  icon: string
  color?: string
  spaceAlias: string
  appMode?: boolean
  defaultView?: string
  priority?: number
}

export const useAppMenuStore = defineStore('appMenu', () => {
  const items = ref<AppMenuEntry[]>([])

  function register(entry: AppMenuEntry) {
    // Avoid duplicates by spaceAlias
    if (items.value.some(e => e.spaceAlias === entry.spaceAlias)) return
    items.value.push(entry)
  }

  return { items, register }
})
