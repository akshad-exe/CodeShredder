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
}

export type ScanResult = {
  targets: CleanupTarget[]
  totalSize: number
  totalCount: number
  scanDuration: number
}

export type CleanInput = {
  paths: string[]
}

export type CleanSummary = {
  total: number
  trashed: number
  failed: number
  errors: { path: string; error: string }[]
}

export type AppSettings = {
  scanRoots: string[]
  enabledPatterns: string[]
  deleteMode: 'dry-run' | 'trash' | 'permanent'
  confirmDangerous: boolean
  confirmMedium: boolean
}

export type WslDistro = {
  name: string
  state: 'Running' | 'Stopped'
  vhdxPath?: string
  sizeBytes?: number
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