import { check, type Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { isTauri } from '@/lib/ipc'

/** Returns the pending update, or null when up to date (or outside Tauri). */
export async function checkForUpdate(): Promise<Update | null> {
  return isTauri() ? check() : null
}

/** Downloads and installs `update`, reporting 0–100 progress, then restarts. */
export async function installUpdate(
  update: Update,
  onProgress: (percent: number) => void,
): Promise<void> {
  let total = 0
  let received = 0
  await update.downloadAndInstall((e) => {
    if (e.event === 'Started') total = e.data.contentLength ?? 0
    if (e.event === 'Progress') {
      received += e.data.chunkLength
      if (total) onProgress(Math.min(100, Math.round((received / total) * 100)))
    }
  })
  await relaunch()
}
