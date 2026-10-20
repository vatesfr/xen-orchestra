import { objectFromEntries } from '@core/utils/object.util.ts'

// Every key is counted, an absent one as 0: a caller reads any key without a fallback
export function countOccurrences<TKey extends PropertyKey>(
  keys: readonly TKey[],
  values: Iterable<TKey>
): Record<TKey, number> {
  const counts = objectFromEntries(keys.map(key => [key, 0] as const))

  for (const value of values) {
    counts[value]++
  }

  return counts
}

export function getCountedKeys<TKey extends PropertyKey>(keys: readonly TKey[], counts: Record<TKey, number>): TKey[] {
  return keys.filter(key => counts[key] > 0)
}
