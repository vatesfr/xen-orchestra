import { countOccurrences, mapCountedKeys } from '@/shared/utils/count.util.ts'

const KEYS = ['a', 'b', 'c'] as const

describe('countOccurrences', () => {
  it('counts each key among the values', () => {
    expect(countOccurrences(KEYS, ['c', 'a', 'c'])).toEqual({ a: 1, b: 0, c: 2 })
  })

  it('counts every key as 0 without values', () => {
    expect(countOccurrences(KEYS, [])).toEqual({ a: 0, b: 0, c: 0 })
  })

  it('leaves out the values that are not keys', () => {
    const keys: readonly string[] = KEYS

    expect(countOccurrences(keys, ['a', 'd', 'toString'])).toEqual({ a: 1, b: 0, c: 0 })
  })
})

describe('mapCountedKeys', () => {
  function describeCount(key: string, count: number) {
    return `${count} ${key}`
  }

  it('maps the counted keys with their count, in the keys order', () => {
    expect(mapCountedKeys(KEYS, { a: 0, b: 2, c: 1 }, describeCount)).toEqual(['2 b', '1 c'])
  })

  it('maps no key when nothing is counted', () => {
    expect(mapCountedKeys(KEYS, { a: 0, b: 0, c: 0 }, describeCount)).toEqual([])
  })
})
