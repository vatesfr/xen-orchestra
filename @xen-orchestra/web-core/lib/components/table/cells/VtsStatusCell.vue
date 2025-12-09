<template>
  <UiTableCell>
    <div class="statuses" :class="{ 'has-label': !iconOnly, progressive: progressiveSize }">
      <VtsStatus
        v-for="(statusItem, index) of statuses"
        :key="index"
        v-tooltip="statusItem.tooltip ?? false"
        :icon-only
        class="status"
        :status="statusItem.status"
      />
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsStatus, { type Status } from '@core/components/status/VtsStatus.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'
import { computed } from 'vue'

export type StatusCellProps = {
  status: MaybeArray<Status | { status: Status; tooltip?: string }>
  progressiveSize?: boolean
  iconOnly?: boolean
}

const { status } = defineProps<StatusCellProps>()

const statuses = computed(() => toArray(status).map(status => (typeof status === 'object' ? status : { status })))
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

    &:first-child {
      scale: 1.2;
    }

    &:nth-child(2) {
      margin-inline-start: 0.7rem;
    }

    /* From 3rd status onward, all are scaled down to 0.8 */
    &:nth-child(n + 3) {
      scale: 0.8;
      margin-inline-start: 0.4rem;

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
