/**
 * Aktenzeichen (AZ) format utilities.
 *
 * AZ hierarchy: aa.bb.cc.dd-ee/f#g-h
 *   Levels 1-4: dot-separated, 2 digits each (01, 01.02, 01.02.03, 01.02.03.04)
 *   Level 5: dash, 2 digits (01.02.03.04-05)
 *   Level 6: slash, 1-2 digits (01.02.03.04-05/1)
 *   Level 7: hash, 1-2 digits (01.02.03.04-05/1#1)
 *   Level 8: dash, 1-2 digits (01.02.03.04-05/1#1-1)
 */

export interface AzLevelInfo {
  separator: string
  padWidth: number // 2 = zero-pad to 2 digits, 0 = 1-2 digits unpadded
}

/**
 * Separator and padding rules for each depth level.
 * Index = parent depth (0 = root/no parent AZ).
 */
export const AZ_LEVELS: AzLevelInfo[] = [
  { separator: '', padWidth: 2 }, // depth 0 → child is level 1: "01"
  { separator: '.', padWidth: 2 }, // depth 1 → level 2: "01.02"
  { separator: '.', padWidth: 2 }, // depth 2 → level 3: "01.02.03"
  { separator: '.', padWidth: 2 }, // depth 3 → level 4: "01.02.03.04"
  { separator: '-', padWidth: 2 }, // depth 4 → level 5: "01.02.03.04-05"
  { separator: '/', padWidth: 0 }, // depth 5 → level 6: "01.02.03.04-05/1"
  { separator: '#', padWidth: 0 }, // depth 6 → level 7: "01.02.03.04-05/1#1"
  { separator: '-', padWidth: 0 }, // depth 7 → level 8: "01.02.03.04-05/1#1-1"
]

export const MAX_AZ_DEPTH = AZ_LEVELS.length

/** Count AZ depth by splitting on all separators. */
export function getAzDepth(az: string): number {
  if (!az) return 0
  return az.split(/[.\-/#]/).filter(Boolean).length
}

/** Get separator and padding info for the next child level. null if max depth reached. */
export function getNextLevelInfo(parentAz: string): AzLevelInfo | null {
  const depth = getAzDepth(parentAz)
  if (depth >= MAX_AZ_DEPTH) return null
  return AZ_LEVELS[depth]
}

/** Format a number according to padding rules. */
export function formatAzNumber(num: number, padWidth: number): string {
  return padWidth > 0 ? String(num).padStart(padWidth, '0') : String(num)
}

/** Build full child AZ from parent AZ and child number. */
export function buildChildAz(parentAz: string, num: number): string {
  const info = getNextLevelInfo(parentAz)
  if (!info) return ''
  const formatted = formatAzNumber(num, info.padWidth)
  return parentAz ? parentAz + info.separator + formatted : formatted
}

/** Extract the child number from a full AZ given the parent AZ. */
export function extractChildNumber(fullAz: string, parentAz: string): number | null {
  const info = getNextLevelInfo(parentAz)
  if (!info) return null
  const prefix = parentAz ? parentAz + info.separator : ''
  if (prefix && !fullAz.startsWith(prefix)) return null
  const rest = fullAz.slice(prefix.length)
  const match = rest.match(/^(\d{1,2})/)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Collect all used AZ numbers among siblings at the next child level.
 * @param siblingRefs Array of fileReference strings from sibling folders
 * @param parentAz The parent folder's AZ
 */
export function findUsedAzNumbers(siblingRefs: string[], parentAz: string): Set<number> {
  const info = getNextLevelInfo(parentAz)
  if (!info) return new Set()

  const prefix = parentAz ? parentAz + info.separator : ''
  const used = new Set<number>()

  for (const ref of siblingRefs) {
    if (!ref) continue
    if (prefix && !ref.startsWith(prefix)) continue
    const rest = prefix ? ref.slice(prefix.length) : ref
    // Match only the number at this level (may have more separators after)
    const match = rest.match(/^(\d{1,2})(?:[.\-/#]|$)/)
    if (match) used.add(parseInt(match[1], 10))
  }

  return used
}

/** Find the first available (unused) number for a child AZ. */
export function findNextAvailableNumber(siblingRefs: string[], parentAz: string): number {
  const used = findUsedAzNumbers(siblingRefs, parentAz)
  for (let i = 1; i <= 99; i++) {
    if (!used.has(i)) return i
  }
  return 1
}

/** Check if a given AZ already exists among siblings. */
export function isDuplicateAz(siblingRefs: string[], az: string): boolean {
  return siblingRefs.some((ref) => ref === az)
}

/** Validate that a user-entered number string is valid (1-2 digits, 1-99). */
export function isValidAzInput(input: string): boolean {
  if (!/^\d{1,2}$/.test(input)) return false
  const num = parseInt(input, 10)
  return num >= 1 && num <= 99
}

/**
 * Validate a complete AZ string against the hierarchical format.
 * Valid examples: "01", "01.02", "01.02.03.04-05/1#2-3"
 */
export function isValidAz(az: string): boolean {
  if (!az) return false
  // Build regex: (dd)(\.dd){0,3}(-dd(/d{1,2}(#d{1,2}(-d{1,2})?)?)?)?
  return /^\d{2}(\.\d{2}){0,3}(-\d{2}(\/\d{1,2}(#\d{1,2}(-\d{1,2})?)?)?)?$/.test(az)
}
