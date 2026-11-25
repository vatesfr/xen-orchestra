import { useDebouncedRef } from '@core/composables/debounced-ref.composable.ts'
import { computed, type ComputedRef, type Ref } from 'vue'

const SEARCH_DEBOUNCE_DELAY = 500

export type SearchBindings = {
  modelValue: string
  'onUpdate:modelValue': (value: string) => void
  busy: boolean
  onSearch: () => void
}

export type UseDebouncedSearchReturn = {
  search: Ref<string>
  debouncedSearch: ComputedRef<string>
  isSearching: ComputedRef<boolean>
  applySearch: () => void
  searchBindings: ComputedRef<SearchBindings>
}

export function useDebouncedSearch(initialValue = ''): UseDebouncedSearchReturn {
  const {
    value: search,
    debouncedValue: debouncedSearch,
    isDebouncing: isSearching,
    forceUpdate: applySearch,
  } = useDebouncedRef(initialValue, SEARCH_DEBOUNCE_DELAY)

  const searchBindings = computed<SearchBindings>(() => ({
    modelValue: search.value,
    'onUpdate:modelValue': (value: string) => (search.value = value),
    busy: isSearching.value,
    onSearch: applySearch,
  }))

  return { search, debouncedSearch, isSearching, applySearch, searchBindings }
}
