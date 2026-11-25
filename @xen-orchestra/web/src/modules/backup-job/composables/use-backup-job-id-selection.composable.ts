import type { SelectionBindings } from '@core/composables/table-selection.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, type Ref } from 'vue'

export function useBackupJobIdSelection<TId extends string>(
  selectedIds: Ref<TId[]>,
  rawItems: MaybeRefOrGetter<{ id: TId }[]>,
  rawFilteredItems: MaybeRefOrGetter<{ id: TId }[]>,
  rawPageItems: MaybeRefOrGetter<{ id: TId }[]>
) {
  const items = toComputed(rawItems)
  const filteredItems = toComputed(rawFilteredItems)
  const pageItems = toComputed(rawPageItems)

  const selectedIdSet = computed(() => new Set(selectedIds.value))

  function isSelected(id: TId): boolean {
    return selectedIdSet.value.has(id)
  }

  function toggleSelection(id: TId): void {
    selectedIds.value = isSelected(id)
      ? selectedIds.value.filter(selectedId => selectedId !== id)
      : [...selectedIds.value, id]
  }

  function selectIds(ids: TId[], shouldSelect: boolean): void {
    const idsToChange = new Set(ids)

    selectedIds.value = shouldSelect
      ? [...new Set([...selectedIds.value, ...ids])]
      : selectedIds.value.filter(id => !idsToChange.has(id))
  }

  function areAllSelected(list: { id: TId }[]): boolean {
    return list.length > 0 && list.every(item => isSelected(item.id))
  }

  const pageSelectionModel = computed<boolean | undefined>({
    get() {
      if (areAllSelected(pageItems.value)) {
        return true
      }

      return pageItems.value.some(item => isSelected(item.id)) ? undefined : false
    },
    set(shouldSelect) {
      selectIds(
        pageItems.value.map(item => item.id),
        shouldSelect === true
      )
    },
  })

  const selectionBindings = computed<SelectionBindings>(() => {
    const selectedCount = items.value.filter(item => isSelected(item.id)).length
    const pageSelectedCount = pageItems.value.filter(item => isSelected(item.id)).length

    return {
      selectedCount,
      hiddenSelectedCount: selectedCount - pageSelectedCount,
      filteredCount: filteredItems.value.length,
      areAllPageItemsSelected: areAllSelected(pageItems.value),
      areAllFilteredItemsSelected: areAllSelected(filteredItems.value),
      areAllItemsSelected: areAllSelected(items.value),
      onSelectAll: () =>
        selectIds(
          filteredItems.value.map(item => item.id),
          true
        ),
      onClearSelection: () => (selectedIds.value = []),
    }
  })

  return {
    isSelected,
    toggleSelection,
    pageSelectionModel,
    selectionBindings,
  }
}
