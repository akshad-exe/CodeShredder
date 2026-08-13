import { listen } from '@tauri-apps/api/event'
import type { UnlistenFn } from '@tauri-apps/api/event'
import type { ScanResult, CleanupTarget } from '@/types/cleanup'

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