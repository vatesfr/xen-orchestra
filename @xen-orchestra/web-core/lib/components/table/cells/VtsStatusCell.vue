<template>
  <UiTableCell>
    <div
      v-if="statuses !== undefined"
      class="statuses"
      :class="{ 'has-label': !iconOnly, progressive: progressiveSize }"
    >
      <VtsStatus
        v-for="(statusItem, index) of statusItems"
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
  statuses: MaybeArray<Status | { status: Status; tooltip?: string }> | undefined
  progressiveSize?: boolean
  iconOnly?: boolean
}

const { statuses: rawStatuses } = defineProps<StatusCellProps>()

const statusItems = computed(() =>
  toArray(rawStatuses).map(status => (typeof status === 'object' ? status : { status }))
)
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
      margin-inline-end: 0.7rem;
    }

    &:nth-child(2) {
      margin-inline-end: 0.4rem;
    }

    /* From 3rd status onward, all are scaled down to 0.8 */
    &:nth-child(n + 3) {
      scale: 0.8;

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
