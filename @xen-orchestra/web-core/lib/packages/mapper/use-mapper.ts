import type { AnyMapping } from './types.ts'
import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'
import { createMapper } from './create-mapper.ts'

export function useMapper<const TFrom extends PropertyKey, const TTo>(
  source: MaybeRefOrGetter<TFrom | undefined>,
  mapping: MaybeRefOrGetter<Record<TFrom, TTo>>,
  defaultSource: NoInfer<MaybeRefOrGetter<TFrom>>
): ComputedRef<TTo>

export function useMapper<const TFrom, const TTo>(
  source: MaybeRefOrGetter<TFrom | undefined>,
  mapping: MaybeRefOrGetter<Map<TFrom, TTo>>,
  defaultSource: NoInfer<MaybeRefOrGetter<TFrom>>
): ComputedRef<TTo>

export function useMapper<const TFrom, const TTo>(
  source: MaybeRefOrGetter<TFrom | undefined>,
  mapping: MaybeRefOrGetter<[TFrom, TTo][]>,
  defaultSource: NoInfer<MaybeRefOrGetter<TFrom>>
): ComputedRef<TTo>

export function useMapper(
  source: MaybeRefOrGetter,
  mapping: MaybeRefOrGetter<AnyMapping>,
  defaultSource: MaybeRefOrGetter
): ComputedRef {
  const mapper = createMapper(mapping, defaultSource)

  return computed(() => mapper(toValue(source)))
}
