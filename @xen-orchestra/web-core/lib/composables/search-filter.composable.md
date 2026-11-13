# `useSearchFilter`

This composable filters a list of items with a text search, applied 500 ms after its last change
(see [`useDebouncedSearch`](./debounced-search.composable.md)).

An item matches when one of its values contains the search, case-insensitively.

## Usage

```vue
<template>
  <UiQuerySearchBar v-bind="searchBindings" />
  <VtsTable :state :pagination-bindings>
    <!-- ... -->
  </VtsTable>
</template>

<script lang="ts" setup>
const { users } = defineProps<{
  users: User[]
}>()

const { items: filteredUsers, searchBindings } = useSearchFilter(() => users)
</script>
```

- `items`: the filtered items
- `hasSearch`: `true` when a search is applied (blank searches are ignored)
- `searchBindings`: the bindings to pass to `UiQuerySearchBar`

## Searchable values

By default, the search looks into `Object.values(item)`.

Pass a second argument to search into other values:

```typescript
const { items: filteredVifs } = useSearchFilter(
  () => vifs,
  vif => [...Object.values(vif), getNetworkName(vif)]
)
```

## No result

```typescript
const { items: filteredTasks, hasSearch } = useSearchFilter(() => tasks)

const hasNoSearchResult = computed(() => hasSearch.value && filteredTasks.value.length === 0)
```
