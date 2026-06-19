import { Resource } from '@opencloud-eu/web-client'

/**
 * Get the Aktenzeichen (oy.fileReference) from a resource.
 * Available as resource.fileReference after DavProperty.FileReference
 * was added to DavProperties.Default in web-client.
 */
export function getFileReference(resource: Resource): string {
  return (resource as any).fileReference || ''
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
