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

  <UiTable vertical-border>
    <thead>
      <tr>
        <td v-if="isSelectable">
          <input v-model="areAllSelected" type="checkbox" />
        </td>
        <slot name="head-row" />
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in filteredAndSortedCollection" :key="item.$ref">
        <td v-if="isSelectable">
          <input v-model="selected" :value="item.$ref" type="checkbox" />
        </td>
        <slot :item name="body-row" />
      </tr>
    </tbody>
  </UiTable>
</template>

<script generic="T extends XenApiRecord<any>" lang="ts" setup>
import CollectionFilter from '@/components/CollectionFilter.vue'
import CollectionSorter from '@/components/CollectionSorter.vue'
import UiTable from '@/components/ui/UiTable.vue'
import useCollectionFilter from '@/composables/collection-filter.composable'
import useCollectionSorter from '@/composables/collection-sorter.composable'
import useFilteredCollection from '@/composables/filtered-collection.composable'
import useMultiSelect from '@/composables/multi-select.composable'
import useSortedCollection from '@/composables/sorted-collection.composable'
import type { XenApiRecord } from '@/libs/xen-api/xen-api.types'
import type { Filters } from '@/types/filter'
import type { Sorts } from '@/types/sort'
import { computed, toRef, watch } from 'vue'

const props = defineProps<{
  modelValue?: T['$ref'][]
  availableFilters?: Filters
  availableSorts?: Sorts
  collection: T[]
}>()

const emit = defineEmits<{
  'update:modelValue': [selectedRefs: T['$ref'][]]
}>()

const isSelectable = computed(() => props.modelValue !== undefined)

const { filters, addFilter, removeFilter, predicate } = useCollectionFilter({
  queryStringParam: 'filter',
})
const { sorts, addSort, removeSort, toggleSortDirection, compareFn } = useCollectionSorter<Record<string, any>>({
  queryStringParam: 'sort',
})

const filteredCollection = useFilteredCollection(toRef(props, 'collection'), predicate)

const filteredAndSortedCollection = useSortedCollection(filteredCollection, compareFn)

const usableRefs = computed(() => props.collection.map(item => item.$ref))

const selectableRefs = computed(() => filteredAndSortedCollection.value.map(item => item.$ref))

const { selected, areAllSelected } = useMultiSelect(usableRefs, selectableRefs)

watch(selected, selected => emit('update:modelValue', selected), {
  immediate: true,
})
</script>

<style lang="postcss" scoped>
.filter-and-sort {
  display: flex;
}
</style>
