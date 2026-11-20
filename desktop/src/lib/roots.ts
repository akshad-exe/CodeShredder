/** Folders where personal files usually live. The backend expands `~` and
 * skips any that don't exist. Added on top of the dev scan roots for the
 * Videos and Large Files pages, which look beyond project folders. */
const MEDIA_ROOTS = ['~/Videos', '~/Movies', '~/Downloads', '~/Desktop']

export function withMediaRoots(roots: string[]): string[] {
  return [...new Set([...roots, ...MEDIA_ROOTS])]
}
