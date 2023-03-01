# useCollectionFilter composable

## Usage

```typescript
const { filters, addFilter, removeFilter, predicate } =
  useCollectionFilter(options);

const filteredCollection = computed(() => myCollection.filter(predicate));
addFilter("name:/^Foo/");
addFilter("count:>3");
```

## Options

### `queryStringParam`

This option allows to activate the URL Query String support.

```typescript
const { addFilter } = useCollectionFilter({ queryStringParam: "filter" });
addFilter("name:/^foo/i"); // Will update the URL with ?filter=name:/^foo/i
```

### Initial filters

This option allows to set some initial filters.

```typescript
const {
  /* ... */
} = useCollectionFilter({ initialFilters: ["!name_label:foobar"] });
```

When using the `initialFilters` option with the `queryStringParam` option,
`initialFilters` will only be applied if no query string parameter is defined in the URL.

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
