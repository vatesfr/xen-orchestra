import { keepIfEqual } from '@/shared/utils/keep-if-equal.util.ts'

it('returns the next value when there is no previous one', () => {
  const next = ['a']

  expect(keepIfEqual(undefined, next)).toBe(next)
})

it('returns the previous value when the next one is deeply equal', () => {
  const previous = { value: 40, maxValue: 100 }
  const previousIds = new Set(['a', 'b'])

  expect(keepIfEqual(previous, { value: 40, maxValue: 100 })).toBe(previous)
  expect(keepIfEqual(previousIds, new Set(['b', 'a']))).toBe(previousIds)
})

it('returns the next value when it differs', () => {
  const next = new Set(['a', 'c'])

  expect(keepIfEqual(new Set(['a', 'b']), next)).toBe(next)
})
