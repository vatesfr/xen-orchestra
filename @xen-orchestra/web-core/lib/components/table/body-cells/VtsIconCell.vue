<template>
  <UiTableCell>
    <div class="icons" :class="{ progressive: progressiveSize }">
      <VtsIcon
        v-for="(icon, index) of icons"
        :key="index"
        v-tooltip="icon.tooltip"
        class="icon"
        :name="icon.name"
        size="current"
      />
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconName } from '@core/icons'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'
import { computed } from 'vue'

export type IconCellProps = {
  icons: MaybeArray<IconName | { name: IconName; tooltip: string }>
  progressiveSize?: boolean
}

const { icons: rawIcons } = defineProps<IconCellProps>()

const icons = computed(() =>
  toArray(rawIcons).map(icon => (typeof icon === 'string' ? { name: icon, tooltip: false } : icon))
)
</script>

<style lang="postcss" scoped>
.icons {
  display: flex;
  align-items: center;
  gap: 1rem;

  &.progressive .icon {
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
