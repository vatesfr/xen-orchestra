import { useArrayMap } from '@vueuse/shared'
import { type MaybeRefOrGetter, type ComputedRef, computed, toValue } from 'vue'

export function transformSources<TSource>(
  sources: MaybeRefOrGetter<any[]>,
  transformer?: (source: any, index: number) => any
) {
  return transformer
    ? (useArrayMap(sources, (source, index) => ({ ...source, ...transformer!(source, index) })) as ComputedRef<
        TSource[]
      >)
    : (computed(() => toValue(sources)) as unknown as ComputedRef<TSource[]>)
}
