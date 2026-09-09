import { Channel, invoke } from '@tauri-apps/api/core'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import type {
  ScanInput,
  ScanSummary,
  CleanSummary,
  CleanMode,
  CleanupHistoryEntry,
  TrashItem,
  TrashResult,
  WslDistro,
  WslCompactResult,
  WslCleanupResult,
  WslProgress,
  CacheEntry,
  CacheCleanResult,
  LargeFileEntry,
  DuplicateGroup,
  VideoEntry,
} from '@/types/cleanup'

/** True when the frontend is running inside the Tauri webview. */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/** Scans roots for known developer-junk folders (MVP v0.2 backend command). */
export async function scanDevFolders(input: ScanInput): Promise<ScanSummary> {
  return invoke<ScanSummary>('scan_dev_folders', { input })
}

/** Asks the in-progress scan to stop early. */
export async function cancelScan(): Promise<void> {
  return invoke('cancel_scan')
}

/** Runs a cleanup over the given paths in the given mode (v0.3 backend command). */
export async function cleanupTargets(
  paths: string[],
  mode: CleanMode = 'trash',
): Promise<CleanSummary> {
  return invoke<CleanSummary>('cleanup_targets', { input: { paths, mode } })
}

/** Returns the most recent cleanup history entries, newest first. */
export async function getCleanupHistory(
  limit?: number,
): Promise<CleanupHistoryEntry[]> {
  return invoke<CleanupHistoryEntry[]>('get_cleanup_history', {
    limit: limit ?? 50,
  })
}

/** Reveals a folder in the OS file explorer (uses the opener plugin). */
export async function revealFolder(path: string): Promise<void> {
  await revealItemInDir(path)
}

/** Lists every item currently in the OS Trash / Recycle Bin. */
export async function listTrash(): Promise<TrashItem[]> {
  return invoke<TrashItem[]>('list_trash')
}

/** Restores the given trash items (by id) to their original locations. */
export async function restoreTrash(ids: string[]): Promise<TrashResult> {
  return invoke<TrashResult>('restore_trash', { ids })
}

/** Permanently deletes the given trash items (by id). */
export async function purgeTrash(ids: string[]): Promise<TrashResult> {
  return invoke<TrashResult>('purge_trash', { ids })
}

/** Permanently deletes every item in the trash. */
export async function emptyTrash(): Promise<TrashResult> {
  return invoke<TrashResult>('empty_trash')
}

/** Lists WSL distros with their running state and virtual disk details. */
export async function listWslDistros(): Promise<WslDistro[]> {
  return invoke<WslDistro[]>('list_wsl_distros')
}

/** Shuts down every running WSL distro. Streams progress via `onEvent`. */
export async function wslShutdown(onEvent: Channel<WslProgress>): Promise<void> {
  return invoke('wsl_shutdown', { onEvent })
}

/** Compacts a distro's virtual disk and reports the reclaimed space. */
export async function wslCompact(
  distro: string,
  onEvent: Channel<WslProgress>,
): Promise<WslCompactResult> {
  return invoke<WslCompactResult>('wsl_compact', { distro, onEvent })
}

/** Runs a cleanup command inside a distro and returns its output. */
export async function wslRunCleanup(
  distro: string,
  commands: string,
  onEvent: Channel<WslProgress>,
): Promise<WslCleanupResult> {
  return invoke<WslCleanupResult>('wsl_run_cleanup', { distro, commands, onEvent })
}

/** Lists known cache locations with their sizes and safety levels. */
export async function listCaches(): Promise<CacheEntry[]> {
  return invoke<CacheEntry[]>('list_caches')
}

/** Cleans the given caches (by id), emptying each one's contents. */
export async function cleanCaches(ids: string[]): Promise<CacheCleanResult[]> {
  return invoke<CacheCleanResult[]>('clean_caches', { ids })
}

/** Scans roots for the largest files above a size threshold. */
export async function scanLargeFiles(input: {
  roots: string[]
  minSizeBytes?: number
  limit?: number
}): Promise<LargeFileEntry[]> {
  return invoke<LargeFileEntry[]>('scan_large_files', { input })
}

/** Scans roots for groups of identical files (by size + content hash). */
export async function scanDuplicates(input: {
  roots: string[]
  minSizeBytes?: number
}): Promise<DuplicateGroup[]> {
  return invoke<DuplicateGroup[]>('scan_duplicates', { input })
}

/** Scans roots for video files. */
export async function scanVideos(input: {
  roots: string[]
  minSizeBytes?: number
}): Promise<VideoEntry[]> {
  return invoke<VideoEntry[]>('scan_videos', { input })
}