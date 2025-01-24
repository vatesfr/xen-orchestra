import { useRouteQuery } from '@core/composables/route-query.composable'
import { clamp, useLocalStorage } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function usePagination<T>(id: string, _records: MaybeRefOrGetter<T[]>) {
  const records = computed(() => toValue(_records))

  const showBy = useLocalStorage(`${id}.per-page`, 50)

  const pageSize = computed({
    get: () => (showBy.value === -1 ? Number.MAX_SAFE_INTEGER : showBy.value),
    set: value => (showBy.value = value),
  })

  function toStartIndex(index: number) {
    return Math.floor(clamp(index, 0, records.value.length - 1) / pageSize.value) * pageSize.value
  }

  const startIndex = useRouteQuery<number>(`${id}.idx`, {
    defaultQuery: '0',
    toData: value => toStartIndex(parseInt(value, 10)),
    toQuery: value => toStartIndex(value).toString(10),
  })

  const endIndex = computed(() => Math.min(startIndex.value + pageSize.value - 1, records.value.length - 1))

  const isFirstPage = computed(() => startIndex.value <= 0)

  const isLastPage = computed(() => endIndex.value >= records.value.length - 1)

  const pageRecords = computed(() => records.value.slice(startIndex.value, endIndex.value + 1))

  function seek(predicate: (record: T) => boolean) {
    const index = records.value.findIndex(predicate)

    if (index !== -1) {
      startIndex.value = index
    }
  }

  function goToNextPage() {
    if (!isLastPage.value) {
      startIndex.value = startIndex.value + pageSize.value
    }
  }

  function goToPreviousPage() {
    if (!isFirstPage.value) {
      startIndex.value = startIndex.value - pageSize.value
    }
  }

  function goToFirstPage() {
    startIndex.value = 0
  }

  function goToLastPage() {
    startIndex.value = records.value.length - 1
  }

  const paginationBindings = computed(() => ({
    showBy: showBy.value,
    'onUpdate:showBy': (value: number) => (showBy.value = value),
    from: Math.max(0, startIndex.value + 1),
    to: endIndex.value + 1,
    total: records.value.length,
    isFirstPage: isFirstPage.value,
    isLastPage: isLastPage.value,
    onFirst: goToFirstPage,
    onLast: goToLastPage,
    onNext: goToNextPage,
    onPrevious: goToPreviousPage,
  }))

  return {
    startIndex,
    endIndex,
    seek,
    showBy,
    isFirstPage,
    isLastPage,
    goToPreviousPage,
    goToNextPage,
    goToFirstPage,
    goToLastPage,
    pageRecords,
    paginationBindings,
  }
}
