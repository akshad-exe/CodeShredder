export type SafetyLevel = 'safe' | 'medium' | 'dangerous'

export type CleanupTarget = {
  id: string
  path: string
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
  targetIds: string[]
  mode: 'dry-run' | 'trash' | 'permanent'
}

export type CleanSummary = {
  cleaned: number
  failed: number
  totalReclaimed: number
  errors: { id: string; error: string }[]
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