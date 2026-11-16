import { type SearchBindings, useDebouncedSearch } from '@core/composables/debounced-search.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { useRouteQuery } from '@vueuse/router'
import { parse } from 'complex-matcher'
import { computed, type ComputedRef, type MaybeRefOrGetter, ref, watch } from 'vue'

export type UseQueryBuilderFilterReturn<TSource> = {
  items: ComputedRef<TSource[]>
  searchBindings: ComputedRef<SearchBindings>
}

export function useQueryBuilderFilter<TSource>(
  id: string,
  sourcesRaw: MaybeRefOrGetter<TSource[]>,
  options?: { initialFilter?: string; ignoreRoute?: boolean }
): UseQueryBuilderFilterReturn<TSource> {
  const initialFilter = options?.initialFilter ?? ''

  const appliedFilter = options?.ignoreRoute ? ref(initialFilter) : useRouteQuery(`qb.${id}`, initialFilter)

  const {
    search: filter,
    debouncedSearch: debouncedFilter,
    applySearch: applyFilter,
    searchBindings,
  } = useDebouncedSearch(appliedFilter.value)

  watch(debouncedFilter, value => {
    appliedFilter.value = value
  })

  watch(appliedFilter, value => {
    if (value !== debouncedFilter.value) {
      filter.value = value
      applyFilter()
    }
  })

  const sources = toComputed(sourcesRaw)

  const mainNode = computed(() => {
    try {
      return parse(debouncedFilter.value)
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

  return { items, searchBindings }
}
