import { expect, test } from 'bun:test'
import { removesEveryCopy } from './duplicates'

const groups = [
  {
    id: 'g',
    sizeBytes: 1,
    files: [
      { id: 'a', path: '/a', name: 'a' },
      { id: 'b', path: '/b', name: 'b' },
    ],
  },
]

test('keeps at least one copy per group', () => {
  expect(removesEveryCopy(groups, [])).toBe(false)
  expect(removesEveryCopy(groups, ['a'])).toBe(false)
  expect(removesEveryCopy(groups, ['a', 'b'])).toBe(true)
})
