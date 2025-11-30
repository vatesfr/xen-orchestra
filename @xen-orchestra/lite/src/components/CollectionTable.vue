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

  <VtsTable :busy :pagination-bindings>
    <thead>
      <tr>
        <slot name="head-row" />
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in filteredAndSortedCollection" :key="item.$ref">
        <slot :item name="body-row" />
      </tr>
    </tbody>
  </VtsTable>
</template>

<script generic="T extends XenApiRecord<any>" lang="ts" setup>
import CollectionFilter from '@/components/CollectionFilter.vue'
import CollectionSorter from '@/components/CollectionSorter.vue'
import useCollectionFilter from '@/composables/collection-filter.composable'
import useCollectionSorter from '@/composables/collection-sorter.composable'
import useFilteredCollection from '@/composables/filtered-collection.composable'
import useSortedCollection from '@/composables/sorted-collection.composable'
import type { XenApiRecord } from '@/libs/xen-api/xen-api.types'
import type { Filters } from '@/types/filter'
import type { Sorts } from '@/types/sort'
import type { PaginationBindings } from '@core/composables/pagination.composable'
import VtsTable from '@core/components/table/VtsTable.vue'
import { toRef } from 'vue'

const props = defineProps<{
  modelValue?: T['$ref'][]
  availableFilters?: Filters
  availableSorts?: Sorts
  collection: T[]
  busy?: boolean
  paginationBindings?: PaginationBindings
}>()

const { filters, addFilter, removeFilter, predicate } = useCollectionFilter({
  queryStringParam: 'filter',
})
const { sorts, addSort, removeSort, toggleSortDirection, compareFn } = useCollectionSorter<Record<string, any>>({
  queryStringParam: 'sort',
})

const filteredCollection = useFilteredCollection(toRef(props, 'collection'), predicate)

const filteredAndSortedCollection = useSortedCollection(filteredCollection, compareFn)
</script>

<style lang="postcss" scoped>
.filter-and-sort {
  display: flex;
}
</style>
