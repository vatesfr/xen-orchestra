import { useDebouncedSearch } from '@core/composables/debounced-search.composable.ts'
import type { TreeNodeBase } from '@core/packages/tree/tree-node-base.ts'
import { computed } from 'vue'

export function useTreeFilter() {
  const { search: filter, debouncedSearch: debouncedFilter, isSearching } = useDebouncedSearch()

  const hasFilter = computed(() => filter.value.trim().length > 0)

  const predicate = (node: TreeNodeBase) =>
    hasFilter.value ? node.label.toLocaleLowerCase().includes(debouncedFilter.value.toLocaleLowerCase()) : undefined

  return { filter, predicate, isSearching, hasFilter }
}
