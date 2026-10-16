import { useTableSelection } from '@core/composables/table-selection.composable.ts'
import { whenever } from '@vueuse/core'
import { type MaybeRefOrGetter, type Ref, toValue, watch } from 'vue'

type SelectableObject = { id: string }

// Binds the rows selection of a scope table to the ids of the manual selection.
export function usePrivilegeScopeSelection(config: {
  selectedIds: Ref<string[]>
  items: MaybeRefOrGetter<SelectableObject[]>
  filteredItems: MaybeRefOrGetter<SelectableObject[]>
  pageItems: MaybeRefOrGetter<SelectableObject[]>
  isReady: MaybeRefOrGetter<boolean>
}) {
  const tableSelection = useTableSelection<SelectableObject>({
    items: config.items,
    filteredItems: config.filteredItems,
    pageItems: config.pageItems,
    getItemId: item => item.id,
  })

  // The selection of an edited privilege can only be restored once its objects are loaded, since the
  // table selection ignores the ids of the items it does not have.
  const initialIds = [...config.selectedIds.value]

  whenever(
    () => toValue(config.isReady),
    () => initialIds.forEach(id => tableSelection.toggleSelection(id, true)),
    { immediate: true, once: true }
  )

  watch(tableSelection.selectedIds, ids => {
    config.selectedIds.value = ids.map(id => String(id))
  })

  return tableSelection
}
