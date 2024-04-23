import type { MaybeArray } from '@core/types/utility.type'

export function toArray<T>(value: MaybeArray<T>): T[] {
  return Array.isArray(value) ? value : [value]
}
