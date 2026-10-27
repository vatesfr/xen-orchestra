import { parse } from 'complex-matcher'

export function filterByQuery<TItem>(items: TItem[], query: string): TItem[] {
  if (query.trim() === '') {
    return []
  }

  try {
    return items.filter(parse(query).createPredicate())
  } catch {
    return []
  }
}
