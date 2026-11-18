import { type SearchBindings, useDebouncedSearch } from '@core/composables/debounced-search.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type ComputedRef, type MaybeRefOrGetter } from 'vue'

export type UseSearchFilterReturn<TSource> = {
  items: ComputedRef<TSource[]>
  hasSearch: ComputedRef<boolean>
  searchBindings: ComputedRef<SearchBindings>
}

export function useSearchFilter<TSource extends object>(
  sourcesRaw: MaybeRefOrGetter<TSource[]>,
  getSearchableValues: (source: TSource) => unknown[] = source => Object.values(source)
): UseSearchFilterReturn<TSource> {
  const { debouncedSearch, searchBindings } = useDebouncedSearch()

  const sources = toComputed(sourcesRaw)

  const searchTerm = computed(() => debouncedSearch.value.trim().toLocaleLowerCase())

  const hasSearch = computed(() => searchTerm.value !== '')

  const items = computed(() => {
    if (!hasSearch.value) {
      return sources.value
    }

    return sources.value.filter(source =>
      getSearchableValues(source).some(value => String(value).toLocaleLowerCase().includes(searchTerm.value))
    )
  })

  return { items, hasSearch, searchBindings }
}
