import type { DuplicateGroup } from '@/types/cleanup'

/** True when removing `ids` would leave some group with no copy at all. */
export function removesEveryCopy(
  groups: DuplicateGroup[],
  ids: Iterable<string>,
): boolean {
  const removed = new Set(ids)
  return groups.some((g) => g.files.every((f) => removed.has(f.id)))
}
