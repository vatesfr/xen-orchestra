import type { AnyMapping } from './types.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { convertToMap } from './convert-to-map.ts'

export function createMapper<const TFrom extends PropertyKey, const TTo>(
  mapping: MaybeRefOrGetter<Record<TFrom, TTo>>,
  defaultSource: NoInfer<MaybeRefOrGetter<TFrom>>
): (source: undefined | TFrom) => TTo

export function createMapper<const TFrom, const TTo>(
  mapping: MaybeRefOrGetter<Map<TFrom, TTo>>,
  defaultSource: NoInfer<MaybeRefOrGetter<TFrom>>
): (source: undefined | TFrom) => TTo

export function createMapper<const TFrom, const TTo>(
  mapping: MaybeRefOrGetter<[TFrom, TTo][]>,
  defaultSource: NoInfer<MaybeRefOrGetter<TFrom>>
): (source: undefined | TFrom) => TTo

export function createMapper(mapping: MaybeRefOrGetter<AnyMapping>, defaultSource: MaybeRefOrGetter) {
  const map = computed(() => convertToMap(toValue(mapping)))

  return function get(source: unknown) {
    if (map.value.has(source)) {
      return map.value.get(source)!
    }

    return map.value.get(toValue(defaultSource))!
  }
}
