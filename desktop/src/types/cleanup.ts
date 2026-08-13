export type SafetyLevel = 'safe' | 'medium' | 'dangerous'

export type CleanupTarget = {
  id: string
  path: string
  displayPath: string
  projectName: string
  folderName: string
  category: string
  sizeBytes: number
  fileCount: number
  lastModified?: string
  safetyLevel: SafetyLevel
  selected: boolean
}

export type ScanInput = {
  roots: string[]
  patterns: string[]
  /** Folder names or path fragments the scan must skip entirely. */
  ignore?: string[]
}

export type ScanResult = {
  targets: CleanupTarget[]
  totalSize: number
  totalCount: number
  scanDuration: number
}

export type CleanMode = 'trash' | 'permanent'

export type CleanInput = {
  paths: string[]
  mode: CleanMode
}

export type CleanSummary = {
  total: number
  affected: number
  failed: number
  mode: CleanMode
  errors: { path: string; error: string }[]
}

export type CleanupHistoryEntry = {
  timestamp: string
  mode: CleanMode
  paths: string[]
  affected: number
  failed: number
  total: number
}

export type AppSettings = {
  scanRoots: string[]
  enabledPatterns: string[]
  deleteMode: CleanMode
  confirmDangerous: boolean
  confirmMedium: boolean
  /** Folder names or path fragments skipped by every scan. */
  ignoreRules: string[]
}

export type WslDistro = {
  name: string
  state: 'Running' | 'Stopped'
  vhdxPath?: string
  sizeBytes?: number
}

export type WslCompactResult = {
  distro: string
  beforeBytes?: number
  afterBytes?: number
  freedBytes?: number
  error?: string
}

export type WslCleanupResult = {
  distro: string
  success: boolean
  output: string
}

export type TrashItem = {
  id: string
  name: string
  originalPath: string
  originalParent: string
  timeDeleted: number
  sizeBytes?: number | null
  entries?: number | null
}

export type TrashResult = {
  total: number
  succeeded: number
  failed: number
  errors: string[]
}

// --- Explore feature types -------------------------------------------------
// UI-contract for the v1.0 "Discover" backend commands. Wired in the frontend
// now; the commands themselves ship later.

export type CacheSafety = 'safe' | 'medium' | 'dangerous'

export type CacheEntry = {
  id: string
  name: string
  path: string
  sizeBytes: number
  category: string
  safety: CacheSafety
}

export type LargeFileEntry = {
  id: string
  path: string
  name: string
  sizeBytes: number
  modifiedAt?: string
  ext: string
}

export type DuplicateFile = {
  id: string
  path: string
  name: string
  modifiedAt?: string
}

export type DuplicateGroup = {
  id: string
  sizeBytes: number
  files: DuplicateFile[]
}

export type VideoEntry = {
  id: string
  path: string
  name: string
  sizeBytes: number
  ext: string
  durationSec?: number
}

export type TreemapNode = {
  path: string
  name: string
  sizeBytes: number
  fileCount: number
  children?: TreemapNode[]
}