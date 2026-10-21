import type { SelectionBindings } from '@core/composables/table-selection.composable.ts'

// Nothing selected: pass the counts and flags the case needs
export function createTableSelectionBindings(overrides: Partial<SelectionBindings> = {}): SelectionBindings {
  return {
    selectedCount: 0,
    hiddenSelectedCount: 0,
    filteredCount: 0,
    areAllPageItemsSelected: false,
    areAllFilteredItemsSelected: false,
    areAllItemsSelected: false,
    onSelectAll: () => {},
    onClearSelection: () => {},
    ...overrides,
  }
}
