import { useDebouncedRef } from '@core/composables/debounced-ref.composable.ts'
import type { TreeNodeBase } from '@core/packages/tree/tree-node-base'
import { whenever } from '@vueuse/shared'
import { computed } from 'vue'

export function useTreeFilter() {
  const {
    value: filter,
    debouncedValue: debouncedFilter,
    isDebouncing: isSearching,
    forceUpdate,
  } = useDebouncedRef('', 500)

  whenever(
    () => filter.value === '',
    () => forceUpdate()
  )

  const hasFilter = computed(() => filter.value.trim().length > 0)

  const predicate = (node: TreeNodeBase) =>
    hasFilter.value ? node.label.toLocaleLowerCase().includes(debouncedFilter.value.toLocaleLowerCase()) : undefined

  return { filter, predicate, isSearching, hasFilter }
}
