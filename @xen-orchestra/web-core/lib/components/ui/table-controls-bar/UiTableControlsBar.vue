<!-- v5 -->
<template>
  <div class="ui-table-controls-bar" :class="className">
    <UiTableSelection v-if="selectionBindings" v-bind="selectionBindings" :size />
    <UiTablePagination v-if="paginationBindings" v-bind="paginationBindings" :size class="pagination" />
  </div>
</template>

<script lang="ts" setup>
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTableSelection from '@core/components/ui/table-selection/UiTableSelection.vue'
import type { PaginationBindings } from '@core/composables/pagination.composable.ts'
import type { SelectionBindings } from '@core/composables/table-selection.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

export type TableControlsBarProps =
  | { selectionBindings: SelectionBindings; paginationBindings?: PaginationBindings }
  | { selectionBindings?: SelectionBindings; paginationBindings: PaginationBindings }

const { selectionBindings, paginationBindings } = defineProps<TableControlsBarProps>()

const uiStore = useUiStore()

const size = computed(() => (uiStore.isSmall ? 'small' : 'large'))

const className = computed(() => toVariants({ size: size.value }))
</script>

<style lang="postcss" scoped>
.ui-table-controls-bar {
  display: flex;
  gap: 0.8rem;

  .pagination {
    margin-inline-start: auto;
  }

  /* SIZE */

  &.size--small {
    flex-direction: column;
  }

  &.size--large {
    flex-direction: row;
  }
}
</style>
