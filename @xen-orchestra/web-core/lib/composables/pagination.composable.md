# usePagination Composable

Handles record pagination with localStorage and route persistence.

The composable uses index-based pagination instead of page numbers, enabling URL sharing across users with different "Show by" settings. The index represents the first visible record.

## Storage

- Route query: `{id}.idx` stores start index
- LocalStorage: `{id}.per-page` stores "Show by" value (default: 50)

## Key Points

- `showBy = -1` displays all records
- `pageRecords` returns current page's records subset
- `seek(predicate)` finds and navigates to specific record's page
- All indices auto-align to page boundaries
- `paginationBindings` contains props and events for `UiTablePagination`

## Usage

```typescript
// Basic usage
const { pageRecords, paginationBindings } = usePagination('items', items)

// Template
<div v-for="item in pageRecords" :key="item.id">
  {{ item.name }}
</div>

<UiTablePagination v-bind="paginationBindings" />
```
