# useCollectionFilter composable

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
import { computed } from "vue";
import CollectionFilter from "@/components/CollectionFilter.vue";
import useCollectionFilter from "@/composables/collection-filter.composable";

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
