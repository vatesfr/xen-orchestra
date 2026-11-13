# `useDebouncedSearch`

This composable holds a search value and applies it 500 ms after its last change.

It is the shared delay of every search field (tables, query builder, treeview).

## Usage

```typescript
const { search, debouncedSearch, isSearching, applySearch } = useDebouncedSearch()

search.value = 'foo'

console.log(debouncedSearch.value) // ''
console.log(isSearching.value) // true

// 500 ms later
console.log(debouncedSearch.value) // 'foo'
console.log(isSearching.value) // false
```

- `search`: the value bound to the input
- `debouncedSearch`: the value to filter with
- `isSearching`: `true` while a change is waiting to be applied
- `applySearch()`: applies the current value right away (e.g. on Enter)
- `searchBindings`: the bindings to pass to `UiQuerySearchBar` or `VtsQueryBuilder`

An empty value is applied right away.

### Initial value

```typescript
const { search, debouncedSearch } = useDebouncedSearch('foo')

console.log(search.value) // 'foo'
console.log(debouncedSearch.value) // 'foo'
```

## Example with `UiQuerySearchBar`

```vue
<template>
  <UiQuerySearchBar v-bind="searchBindings" />
</template>

<script lang="ts" setup>
const { debouncedSearch, searchBindings } = useDebouncedSearch()
</script>
```

To filter a list of items, see [`useSearchFilter`](./search-filter.composable.md).
