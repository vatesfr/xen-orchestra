<template>
  <div class="table-container">
    <UiTablePagination v-if="isReady" v-bind="paginationBindings" />
    <VtsLoadingHero v-if="!isReady" type="table" />
    <VtsErrorNoDataHero v-else-if="hasError" type="table" />
    <VtsNoDataHero v-else-if="noDataMessage" type="table" />
    <VtsTable v-else vertical-border>
      <thead>
        <slot name="thead" />
      </thead>
      <tbody>
        <template v-for="(vnode, index) in pageRecords" :key="index">
          <component :is="vnode" />
        </template>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import VtsErrorNoDataHero from '@core/components/state-hero/VtsErrorNoDataHero.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import UiTablePagination from '../ui/table-pagination/UiTablePagination.vue'

defineProps<{
  isReady?: boolean
  hasError?: boolean
  noDataMessage?: string
}>()

const slots = defineSlots<{
  thead(): any
  tbody(): any
}>()

const vnodes = slots.tbody?.() || []
const rowElement = new Array<any>()

function countRow(vnodes: any[]): number {
  let count = 0

  for (const vnode of vnodes) {
    if (vnode.type === 'tr') {
      count++
      rowElement.push(vnode)
    } else if (Array.isArray(vnode.children)) {
      count += countRow(vnode.children)
    }
  }
  return count
}

countRow(vnodes)

const { pageRecords, paginationBindings } = usePagination('items', rowElement)
</script>

<style lang="postcss" scoped>
.table-container {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  overflow-x: auto;

  :deep(tbody) tr {
    &:hover {
      cursor: pointer;
      background-color: var(--color-brand-background-hover);
    }

    &:active {
      background-color: var(--color-brand-background-active);
    }

    &.selected {
      background-color: var(--color-brand-background-selected);
    }

    &:last-child {
      border-bottom: 0.1rem solid var(--color-neutral-border);
    }
  }

  :deep(th) {
    width: 10rem;
  }
}
</style>
