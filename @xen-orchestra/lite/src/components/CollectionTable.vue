<template>
  <CollectionFilter
    v-if="availableFilters"
    :active-filters="filters"
    :available-filters="availableFilters"
    @add-filter="addFilter"
    @remove-filter="removeFilter"
  />

  <UiTable>
    <template #header>
      <td v-if="isSelectable">
        <input v-model="areAllSelected" type="checkbox" />
      </td>
      <slot name="header" />
    </template>

    <tr v-for="item in filteredCollection" :key="item.$ref">
      <td v-if="isSelectable">
        <input v-model="selected" :value="item.$ref" type="checkbox" />
      </td>
      <slot :item="item" name="row" />
    </tr>
  </UiTable>
</template>

<script lang="ts" setup>
import { computed, toRef, watch } from "vue";
import type { AvailableFilter } from "@/types/filter";
import CollectionFilter from "@/components/CollectionFilter.vue";
import UiTable from "@/components/ui/UiTable.vue";
import useCollectionFilter from "@/composables/collection-filter.composable";
import useFilteredCollection from "@/composables/filtered-collection.composable";
import useMultiSelect from "@/composables/multi-select.composable";
import type { XenApiRecord } from "@/libs/xen-api";

const props = defineProps<{
  modelValue?: string[];
  availableFilters?: AvailableFilter[];
  collection: XenApiRecord[];
}>();

const emit = defineEmits<{
  (event: "update:modelValue", selectedRefs: string[]): void;
}>();

const isSelectable = computed(() => props.modelValue !== undefined);

const { filters, addFilter, removeFilter, predicate } = useCollectionFilter();

const filteredCollection = useFilteredCollection(
  toRef(props, "collection"),
  predicate
);

const usableRefs = computed(() => props.collection.map((item) => item.$ref));

const selectableRefs = computed(() =>
  filteredCollection.value.map((item) => item.$ref)
);

const { selected, areAllSelected } = useMultiSelect(usableRefs, selectableRefs);

watch(selected, (selected) => emit("update:modelValue", selected), {
  immediate: true,
});
</script>

<style scoped></style>
