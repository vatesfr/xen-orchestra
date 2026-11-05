/**
 * Groups `items` by the key `getKey` derives from each of them, preserving their order
 * inside each group. Meant to build the `xsByY` maps the remote-resource collections
 * expose (`hostsByPool`, `pifsByHost`, `pbdsBySr`…) from a flat fixture array, so a test
 * keeps a single source of truth for its objects.
 */
export function groupBy<TItem, TKey>(items: TItem[], getKey: (item: TItem) => TKey): Map<TKey, TItem[]> {
  const groups = new Map<TKey, TItem[]>()

  for (const item of items) {
    const key = getKey(item)
    const group = groups.get(key) ?? []

    group.push(item)
    groups.set(key, group)
  }

  return groups
}
