# useTableSelection Composable

Handles the rows selection of a filtered and paginated table.

The selection is stored by item ID, so it is kept when changing page or filter.

## Parameters

| Name            | Type                                | Description                                 |
| --------------- | ----------------------------------- | ------------------------------------------- |
| `items`         | `MaybeRefOrGetter<TItem[]>`         | All the items of the table (before filters) |
| `filteredItems` | `MaybeRefOrGetter<TItem[]>`         | The items matching the current filter       |
| `pageItems`     | `MaybeRefOrGetter<TItem[]>`         | The items displayed on the current page     |
| `getItemId`     | `(item: TItem) => CollectionItemId` | Returns the ID of an item                   |

`filteredItems` and `pageItems` must contain items of the same type as `items`. Only their IDs are used.

## Returned values

| Name                  | Description                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `selectedIds`         | IDs of the selected items, including the ones hidden by the filter                              |
| `pageSelectionModel`  | Model for the header checkbox: `true` (whole page selected), `undefined` (partially) or `false` |
| `isSelected(id)`      | Returns whether the item is selected                                                            |
| `toggleSelection(id)` | Toggles the item                                                                                |
| `selectionBindings`   | Props and events for `UiTableSelection` (or `VtsTable`'s `selection-bindings` prop)             |

## Key Points

- "Select all" selects every item matching the filter
- "Clear selection" unselects every item, including the ones hidden by the filter
- IDs of items that are no longer in `items` are not part of `selectedIds`

## Usage

```typescript
const { items: filteredVms, filter } = useQueryBuilderFilter('vms', () => vms.value)

const { pageRecords: paginatedVms, paginationBindings } = usePagination('vms', filteredVms)

const { selectedIds, pageSelectionModel, isSelected, toggleSelection, selectionBindings } = useTableSelection({
  items: () => vms.value,
  filteredItems: filteredVms,
  pageItems: paginatedVms,
  getItemId: vm => vm.id,
})

const { HeadCells, BodyCells } = useVmColumns({
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (vm: Vm) => ({
    checkbox: r =>
      r({
        selected: isSelected(vm.id),
        onToggle: () => toggleSelection(vm.id),
      }),
    // ...
  }),
})
```

```html
<VtsTable :pagination-bindings :selection-bindings>
  <!-- ... -->
</VtsTable>
```
