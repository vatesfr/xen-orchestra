<template>
  <UiTableCell>
    <div class="statuses" :class="{ 'has-label': !iconOnly, progressive: progressiveSize }">
      <VtsStatus v-for="(status, index) of statuses" :key="index" :icon-only class="status" :status />
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsStatus, { type Status } from '@core/components/status/VtsStatus.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'
import { computed } from 'vue'

export type StatusCellProps = {
  statuses: MaybeArray<Status>
  progressiveSize?: boolean
  iconOnly?: boolean
}

const { statuses: rawStatuses } = defineProps<StatusCellProps>()

const statuses = computed(() => toArray(rawStatuses))
</script>

<style lang="postcss" scoped>
.statuses {
  display: flex;
  align-items: center;

  &.has-label {
    gap: 1.2rem;
  }

  &.progressive .status {
    position: relative;
    font-size: 1.8rem;

    &:first-child:not(:last-child) {
      transform: scale(1.2);
      margin-inline-end: 0.4rem;
    }

    &:last-child:not(:first-child) {
      transform: scale(0.8);

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        transform: scale(1.7);
      }
    }
  }
}
</style>
