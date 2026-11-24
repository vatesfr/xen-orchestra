import { parse } from 'complex-matcher'

export function filterByQuery<TItem>(
  items: TItem[],
  query: string,
  toContext: (item: TItem) => unknown = item => item
): TItem[] {
  if (query.trim() === '') {
    return []
  }

  try {
    const predicate = parse(query).createPredicate()

    return items.filter(item => predicate(toContext(item)))
  } catch {
    return []
  }
}
