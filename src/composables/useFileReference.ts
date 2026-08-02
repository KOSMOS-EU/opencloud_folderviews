import { Resource } from '@opencloud-eu/web-client'

const PROP_KEY = 'om:oy.fileReference'

/**
 * Get the Aktenzeichen (oy.fileReference) from a resource.
 * Requires registerExtraProp('om:oy.fileReference') + buildPropFindBody fix.
 */
export function getFileReference(resource: Resource): string {
  const val = (resource as any).extraProps?.[PROP_KEY]
  return val ? String(val) : ''
}

/**
 * Build display name: "aktz name" if showAktz and fileReference exists, else just name.
 */
export function displayName(resource: Resource, showAktz: boolean): string {
  if (!showAktz) return resource.name || ''
  const aktz = getFileReference(resource)
  if (aktz) return `${aktz} ${resource.name}`
  return resource.name || ''
}

/**
 * Sort comparator using displayName (with optional aktz prefix).
 */
export function compareByDisplayName(a: Resource, b: Resource, showAktz: boolean): number {
  const na = displayName(a, showAktz).toLowerCase()
  const nb = displayName(b, showAktz).toLowerCase()
  return na.localeCompare(nb, undefined, { numeric: true })
}

/**
 * Prefix resource names with Aktenzeichen if present.
 * Used by resourceTransformer and Tree child-loading.
 */
export function prefixResources<T extends Resource>(resources: T[]): T[] {
  return resources.map((r) => {
    const aktz = (r as any).extraProps?.[PROP_KEY]
    if (!aktz) return r
    return { ...r, name: `${aktz} ${r.name}`, _originalName: r.name } as T
  })
}

/**
 * Get the sort key for a resource: original name if ignoreAktz, else current name.
 */
export function sortName(resource: Resource, ignoreAktz: boolean): string {
  if (ignoreAktz && (resource as any)._originalName) {
    return (resource as any)._originalName
  }
  return resource.name || ''
}
