import type { SortRouteQuery } from '@core/composables/sort-route-query.composable'
import type { CompareFn, SortingDefinition } from '@core/composables/table/type'
import { computed } from 'vue'

export function createSortingDefinition<TCompareReturn extends number | unknown>(
  columnId: string,
  sortRouteQuery: SortRouteQuery,
  compareFn: CompareFn<any, TCompareReturn> | undefined
): SortingDefinition<any, TCompareReturn> {
  if (compareFn === undefined) {
    return {
      isSortable: false,
    } as SortingDefinition<any, TCompareReturn>
  }

  const isSorted = computed(() => sortRouteQuery.value?.id === columnId)

  const isSortedAsc = computed(() => isSorted.value && sortRouteQuery.value?.direction === 'asc')

  const isSortedDesc = computed(() => isSorted.value && sortRouteQuery.value?.direction === 'desc')

  function sort(direction: 'asc' | 'desc' | false, toggleOffIfSameDirection = false) {
    const shouldToggleOff =
      direction === false ||
      (toggleOffIfSameDirection && isSorted.value && sortRouteQuery.value?.direction === direction)

    sortRouteQuery.value = shouldToggleOff ? undefined : { id: columnId, direction }
  }

  function sortAsc(toggleOffIfSameDirection = false) {
    sort('asc', toggleOffIfSameDirection)
  }

  function sortDesc(toggleOffIfSameDirection = false) {
    sort('desc', toggleOffIfSameDirection)
  }

  return {
    isSortable: true,
    isSorted,
    isSortedAsc,
    isSortedDesc,
    sort,
    sortAsc,
    sortDesc,
    compareFn,
  } as SortingDefinition<any, TCompareReturn>
}
