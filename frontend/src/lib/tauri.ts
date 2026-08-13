import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import type { UnlistenFn } from '@tauri-apps/api/event'
import type {
  ScanInput,
  ScanResult,
  CleanSummary,
  CleanMode,
  CleanupHistoryEntry,
  CleanupTarget,
  TrashItem,
  TrashResult,
} from '@/types/cleanup'

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown
  }
}

/** True when the frontend is running inside the Tauri webview. */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/** Scans roots for known developer-junk folders (MVP v0.2 backend command). */
export async function scanDevFolders(input: ScanInput): Promise<ScanResult> {
  return invoke<ScanResult>('scan_dev_folders', { input })
}

/** Subscribes to live per-target events emitted during a scan. */
export async function onScanTarget(
  handler: (target: CleanupTarget) => void,
): Promise<UnlistenFn> {
  return listen<CleanupTarget>('scan-target', (event) => handler(event.payload))
}

/** Subscribes to the final, size-sorted scan result. */
export async function onScanComplete(
  handler: (result: ScanResult) => void,
): Promise<UnlistenFn> {
  return listen<ScanResult>('scan-complete', (event) => handler(event.payload))
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