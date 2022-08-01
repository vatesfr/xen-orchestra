# useCollectionFilter composable

## Usage

```typescript
const { filters, addFilter, removeFilter, predicate } = useCollectionFilter();

const filteredCollection = myCollection.filter(predicate);
```

## URL Query String

By default, when adding/removing filters, the URL will update automatically.

```typescript
addFilter('name:/^foo/i'); // Will update the URL with ?filter=name:/^foo/i
```

### Change the URL query string parameter name

```typescript
const { /* ... */ } = useCollectionFilter({ queryStringParam: 'f' }); // ?f=name:/^foo/i
```

### Disable the usage of URL query string

```typescript
const { /* ... */ } = useCollectionFilter({ queryStringParam: undefined });
```

## Example of using the composable with the `CollectionFilter` component

```vue
<template>
  <CollectionFilter
    :active-filters="filters"
    :available-filters="availableFilters"
    @add-filter="addFilter"
    @remove-filter="removeFilter"
  />
  
  <div v-for="item in filteredCollection">...</div>
</template>

<script lang="ts" setup>
  import CollectionFilter from "@/components/CollectionFilter.vue";
  import useCollectionFilter from "@/composables/collection-filter.composable";
  import { computed } from "vue";

  const collection = [
    { name: "Foo", age: 5, registered: true },
    { name: "Bar", age: 12, registered: false },
    { name: "Foo Bar", age: 2, registered: true },
    { name: "Bar Baz", age: 45, registered: false },
    { name: "Foo Baz", age: 32, registered: false },
    { name: "Foo Bar Baz", age: 32, registered: true },
  ];

  const availableFilters: AvailableFilter[] = [
    { property: "name", label: "Name", type: "string" },
    { property: "age", label: "Age", type: "number" },
    { property: "registered", label: "Registered", type: "boolean", icon: faKey },
  ];

  const { filters, addFilter, removeFilter, predicate } = useCollectionFilter();
  
  const filteredCollection = computed(() => collection.filter(predicate));
</script>
```
