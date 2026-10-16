<template>
  <UiColumnHeader class="vts-header-cell">
    <button v-if="sortable" type="button" class="sort-button" @click="emit('sort')">
      <slot />
      <VtsIcon :name="sortIcon" size="small" />
    </button>
    <slot v-else />
  </UiColumnHeader>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiColumnHeader from '@core/components/ui/column-header/UiColumnHeader.vue'
import type { ColumnSortDirection } from '@core/packages/table'
import { computed } from 'vue'

const { sortDirection } = defineProps<{
  sortable?: boolean
  sortDirection?: ColumnSortDirection
}>()

const emit = defineEmits<{
  sort: []
}>()

const sortIcon = computed(() => {
  if (sortDirection === undefined) {
    return undefined
  }

  return sortDirection === 'asc' ? 'table:arrow-up' : 'table:arrow-down'
})
</script>

<style lang="postcss" scoped>
.vts-header-cell {
  max-width: 30rem;

  .sort-button {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    text-align: start;
    cursor: pointer;
  }
}
</style>
