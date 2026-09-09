import { listen } from '@tauri-apps/api/event'
import type { UnlistenFn } from '@tauri-apps/api/event'
import type { ScanResult, CleanupTarget } from '@/types/cleanup'

/** Subscribes to live, batched scan progress: arrays of targets streamed as
 * they're measured, flushed every ~25 targets or ~100 ms. */
export async function onScanTargets(
  handler: (targets: CleanupTarget[]) => void,
): Promise<UnlistenFn> {
  return listen<CleanupTarget[]>('scan-targets', (event) => handler(event.payload))
}

/** Subscribes to the final, size-sorted scan result. */
export async function onScanComplete(
  handler: (result: ScanResult) => void,
): Promise<UnlistenFn> {
  return listen<ScanResult>('scan-complete', (event) => handler(event.payload))
}