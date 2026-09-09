import { listen } from '@tauri-apps/api/event'
import type { UnlistenFn } from '@tauri-apps/api/event'
import type { ScanSummary, CleanupTarget } from '@/types/cleanup'

/** Subscribes to live, batched scan progress: arrays of targets streamed as
 * they're measured, flushed every ~25 targets or ~100 ms. */
export async function onScanTargets(
  handler: (targets: CleanupTarget[]) => void,
): Promise<UnlistenFn> {
  return listen<CleanupTarget[]>('scan-targets', (event) => handler(event.payload))
}

/** Subscribes to the final scan summary. The accumulated targets are already
 * streamed in batches; this carries only totals and lets the frontend finalize
 * (sort) its list. */
export async function onScanComplete(
  handler: (summary: ScanSummary) => void,
): Promise<UnlistenFn> {
  return listen<ScanSummary>('scan-complete', (event) => handler(event.payload))
}
