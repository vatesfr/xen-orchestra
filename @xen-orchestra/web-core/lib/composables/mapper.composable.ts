import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'

export function useMapper<TFrom extends string | number, TTo>(
  _source: MaybeRefOrGetter<TFrom | undefined>,
  mapping: Record<TFrom, TTo>,
  _defaultValue: MaybeRefOrGetter<TTo>
): ComputedRef<TTo> {
  return computed(() => {
    const source = toValue(_source)
    const defaultValue = toValue(_defaultValue)

    if (source === undefined) {
      return defaultValue
    }

    return Object.prototype.hasOwnProperty.call(mapping, source) ? mapping[source] : defaultValue
  })
}
