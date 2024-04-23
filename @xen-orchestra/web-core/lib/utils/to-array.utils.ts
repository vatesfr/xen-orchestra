import type { MaybeArray } from '@core/types/utility.type'

export function toArray<T>(value: MaybeArray<T> | undefined): T[] {
  if (value === undefined) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}
