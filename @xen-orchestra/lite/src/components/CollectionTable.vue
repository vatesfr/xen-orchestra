<template>
  <div class="filter-and-sort">
    <CollectionFilter
      v-if="availableFilters !== undefined"
      :active-filters="filters"
      :available-filters="availableFilters"
      @add-filter="addFilter"
      @remove-filter="removeFilter"
    />

    <CollectionSorter
      v-if="availableSorts !== undefined"
      :active-sorts="sorts"
      :available-sorts="availableSorts"
      @add-sort="addSort"
      @remove-sort="removeSort"
      @toggle-sort-direction="toggleSortDirection"
    />
  </div>

  <UiTable>
    <template #header>
      <td v-if="isSelectable">
        <input v-model="areAllSelected" type="checkbox" />
      </td>
      <slot name="header" />
    </template>

    <tr v-for="item in filteredAndSortedCollection" :key="item[idProperty]">
      <td v-if="isSelectable">
        <input
          v-model="selected"
          :value="item[props.idProperty]"
          type="checkbox"
        />
      </td>
      <slot :item="item" name="row" />
    </tr>
  </UiTable>
</template>

<script lang="ts" setup>
import { computed, toRef, watch } from "vue";
import type { Filters } from "@/types/filter";
import type { Sorts } from "@/types/sort";
import CollectionFilter from "@/components/CollectionFilter.vue";
import CollectionSorter from "@/components/CollectionSorter.vue";
import UiTable from "@/components/ui/UiTable.vue";
import useCollectionFilter from "@/composables/collection-filter.composable";
import useCollectionSorter from "@/composables/collection-sorter.composable";
import useFilteredCollection from "@/composables/filtered-collection.composable";
import useMultiSelect from "@/composables/multi-select.composable";
import useSortedCollection from "@/composables/sorted-collection.composable";

const props = defineProps<{
  modelValue?: string[];
  availableFilters?: Filters;
  availableSorts?: Sorts;
  collection: Record<string, any>[];
  idProperty: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", selectedRefs: string[]): void;
}>();

const isSelectable = computed(() => props.modelValue !== undefined);

const { filters, addFilter, removeFilter, predicate } = useCollectionFilter({
  queryStringParam: "filter",
});
const { sorts, addSort, removeSort, toggleSortDirection, compareFn } =
  useCollectionSorter<Record<string, any>>({ queryStringParam: "sort" });

const filteredCollection = useFilteredCollection(
  toRef(props, "collection"),
  predicate
);

const filteredAndSortedCollection = useSortedCollection(
  filteredCollection,
  compareFn
);

const usableRefs = computed(() =>
  props.collection.map((item) => item[props.idProperty])
);

const selectableRefs = computed(() =>
  filteredAndSortedCollection.value.map((item) => item[props.idProperty])
);

const { selected, areAllSelected } = useMultiSelect(usableRefs, selectableRefs);

watch(selected, (selected) => emit("update:modelValue", selected), {
  immediate: true,
});
</script>

<style lang="postcss" scoped>
.filter-and-sort {
  display: flex;
}
</style>
