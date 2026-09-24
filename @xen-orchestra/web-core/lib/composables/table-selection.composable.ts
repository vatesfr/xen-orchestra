import { type CollectionItemId, useCollection } from '@core/packages/collection'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export type SelectionBindings = {
  selectedCount: number
  hiddenSelectedCount: number
  filteredCount: number
  areAllPageItemsSelected: boolean
  areAllFilteredItemsSelected: boolean
  areAllItemsSelected: boolean
  onSelectAll: () => void
  onClearSelection: () => void
}

export function useTableSelection<TItem>(config: {
  items: MaybeRefOrGetter<TItem[]>
  filteredItems: MaybeRefOrGetter<NoInfer<TItem>[]>
  pageItems: MaybeRefOrGetter<NoInfer<TItem>[]>
  getItemId: (item: TItem) => CollectionItemId
}) {
  const filteredIds = computed(() => new Set(toValue(config.filteredItems).map(item => config.getItemId(item))))

  const pageIds = computed(() => new Set(toValue(config.pageItems).map(item => config.getItemId(item))))

  const { useFlag, useSubset, clearFlag } = useCollection(config.items, {
    itemId: config.getItemId,
    flags: { selected: true },
  })

  const selectionFlag = useFlag('selected')

  const filteredCollection = useSubset(item => filteredIds.value.has(item.id))

  const filteredSelectionFlag = filteredCollection.useFlag('selected')

  const pageSelectionFlag = useSubset(item => pageIds.value.has(item.id)).useFlag('selected')

  const pageSelectionModel = computed<boolean | undefined>({
    get() {
      if (pageSelectionFlag.areAllOn.value) {
        return true
      }

      return pageSelectionFlag.areSomeOn.value ? undefined : false
    },
    set(shouldSelect) {
      pageSelectionFlag.toggleAll(shouldSelect === true)
    },
  })

  const selectionBindings = computed<SelectionBindings>(() => ({
    selectedCount: selectionFlag.count.value,
    hiddenSelectedCount: selectionFlag.count.value - pageSelectionFlag.count.value,
    filteredCount: filteredCollection.count.value,
    areAllPageItemsSelected: pageSelectionFlag.areAllOn.value,
    areAllFilteredItemsSelected: filteredSelectionFlag.areAllOn.value,
    areAllItemsSelected: selectionFlag.areAllOn.value,
    onSelectAll: () => filteredSelectionFlag.toggleAll(true),
    onClearSelection: () => clearFlag('selected'),
  }))

  return {
    selectedIds: selectionFlag.ids,
    pageSelectionModel,
    isSelected: selectionFlag.isOn,
    toggleSelection: selectionFlag.toggle,
    selectionBindings,
  }
}
