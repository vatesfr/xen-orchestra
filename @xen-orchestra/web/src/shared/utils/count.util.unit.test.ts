import { countOccurrences, getCountedKeys } from '@/shared/utils/count.util.ts'

const KEYS = ['a', 'b', 'c'] as const

describe('countOccurrences', () => {
  it('counts each key among the values', () => {
    expect(countOccurrences(KEYS, ['c', 'a', 'c'])).toEqual({ a: 1, b: 0, c: 2 })
  })

  it('counts every key as 0 without values', () => {
    expect(countOccurrences(KEYS, [])).toEqual({ a: 0, b: 0, c: 0 })
  })
})

describe('getCountedKeys', () => {
  it('keeps the counted keys, in the keys order', () => {
    expect(getCountedKeys(KEYS, { a: 0, b: 2, c: 1 })).toEqual(['b', 'c'])
  })

  it('keeps no key when nothing is counted', () => {
    expect(getCountedKeys(KEYS, { a: 0, b: 0, c: 0 })).toEqual([])
  })
})
