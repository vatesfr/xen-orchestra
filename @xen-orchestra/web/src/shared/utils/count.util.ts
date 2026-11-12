import { objectFromEntries } from '@core/utils/object.util.ts'

// Every key is counted, an absent one as 0: a caller reads any key without a fallback. A value that is not a key is
// left out, so that dynamic keys (ids) can be counted against the known ones
export function countOccurrences<TKey extends PropertyKey>(
  keys: readonly TKey[],
  values: Iterable<TKey>
): Record<TKey, number> {
  const counts = objectFromEntries(keys.map(key => [key, 0] as const))

  for (const value of values) {
    if (Object.hasOwn(counts, value)) {
      counts[value]++
    }
  }

  return counts
}

// Only the counted keys, in the keys order: a key nothing was counted for has nothing to show
export function mapCountedKeys<TKey extends PropertyKey, TResult>(
  keys: readonly TKey[],
  counts: Record<TKey, number>,
  mapper: (key: TKey, count: number) => TResult
): TResult[] {
  return keys.filter(key => counts[key] > 0).map(key => mapper(key, counts[key]))
}
