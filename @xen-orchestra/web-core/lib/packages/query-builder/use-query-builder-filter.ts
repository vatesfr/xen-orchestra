import { toComputed } from '@core/utils/to-computed.util.ts'
import { useRouteQuery } from '@vueuse/router'
import { parse } from 'complex-matcher'
import { computed, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'

export type UseQueryBuilderFilterReturn<TSource> = {
  items: ComputedRef<TSource[]>
  filter: Ref<string>
}

export function useQueryBuilderFilter<TSource>(
  id: string,
  sourcesRaw: MaybeRefOrGetter<TSource[]>,
  options?: { initialFilter?: string }
): UseQueryBuilderFilterReturn<TSource> {
  const filter = useRouteQuery(`qb.${id}`, options?.initialFilter ?? '')

  const sources = toComputed(sourcesRaw)

  const mainNode = computed(() => {
    try {
      return parse(filter.value)
    } catch {
      return undefined
    }
  })

  const predicate = computed(() => {
    if (mainNode.value === undefined) {
      return undefined
    }

    return mainNode.value.createPredicate()
  })

  const items = computed(() => (predicate.value ? sources.value.filter(predicate.value) : sources.value))

  return { items, filter }
}
