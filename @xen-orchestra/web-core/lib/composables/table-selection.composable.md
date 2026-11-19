# useTableSelection Composable

Handles the rows selection of a filtered and paginated table.

The selection is stored by item ID, so it is kept when changing page or filter.

## Parameters

| Name            | Type                        | Description                                                  |
| --------------- | --------------------------- | ------------------------------------------------------------ |
| `items`         | `MaybeRefOrGetter<TItem[]>` | All the items of the table (before filters)                  |
| `filteredItems` | `MaybeRefOrGetter<TItem[]>` | The items matching the current filter                        |
| `pageItems`     | `MaybeRefOrGetter<TItem[]>` | The items displayed on the current page                      |
| `getItemId`     | `(item: TItem) => TId`      | Returns the ID of an item (`TId` extends `CollectionItemId`) |
| `selectedIds`   | `Ref<TId[]>`                | Optional ref holding the selected IDs (see below)            |

`filteredItems` and `pageItems` must contain items of the same type as `items`. Only their IDs are used.

The returned IDs keep the type `getItemId` returns (a branded ID stays branded).

### `selectedIds`

Without it, the selection is kept by the composable and starts empty.

With it, the selection is read from and written to the given ref (a `defineModel` for example): its value when the composable is called is the initial selection, and it can be changed from outside.

```typescript
const selectedVmIds = defineModel<Vm['id'][]>('selectedVmIds', { required: true })

const { pageSelectionModel, isSelected, toggleSelection, selectionBindings } = useTableSelection({
  items: () => vms.value,
  filteredItems: filteredVms,
  pageItems: paginatedVms,
  getItemId: vm => vm.id,
  selectedIds: selectedVmIds,
})
```

IDs that match no item of `items` are kept in the ref, so the selection can be set before the items are loaded. They are ignored by the returned values.

## Returned values

| Name                  | Description                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `selectedIds`         | IDs of the selected items, including the ones hidden by the filter                              |
| `selectedItems`       | The selected items, including the ones hidden by the filter                                     |
| `pageSelectionModel`  | Model for the header checkbox: `true` (whole page selected), `undefined` (partially) or `false` |
| `isSelected(id)`      | Returns whether the item is selected                                                            |
| `toggleSelection(id)` | Toggles the item                                                                                |
| `selectionBindings`   | Props and events for `UiTableSelection` (or `VtsTable`'s `selection-bindings` prop)             |

## Key Points

- "Select all" selects every item matching the filter
- "Clear selection" unselects every item, including the ones hidden by the filter
- Items that are no longer in `items` are not part of `selectedIds` nor `selectedItems`
- A row checkbox can be disabled with the optional `disabled` binding of the `checkbox` body cell; the header checkbox and "Select all" still include that row, so keep it out of `items` if it must never be selected

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
