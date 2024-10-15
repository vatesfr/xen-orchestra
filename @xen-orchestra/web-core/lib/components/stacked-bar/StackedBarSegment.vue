<template>
  <div
    v-if="percentage > 0"
    v-tooltip="{ selector: '.text-ellipsis' }"
    :class="color"
    :style="{ width: percentage + '%' }"
    class="stacked-bar-segment typo c4-semi-bold"
  >
    <div ref="ellipsisElement" :class="{ hidden }" class="text-ellipsis">
      {{ $n(percentage / 100, 'percent') }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { vTooltip } from '@core/directives/tooltip.directive'
import { hasEllipsis } from '@core/utils/has-ellipsis.util'
import { useResizeObserver } from '@vueuse/core'
import { ref } from 'vue'

export type StackedBarSegmentColor = 'primary' | 'success' | 'warning' | 'danger'

export type StackedBarSegmentProps = {
  color: StackedBarSegmentColor
  percentage: number
}

defineProps<StackedBarSegmentProps>()

const hidden = ref(false)
const ellipsisElement = ref<HTMLElement | null>(null)

useResizeObserver(ellipsisElement, ([entry]) => {
  hidden.value = hasEllipsis(entry.target)
})
</script>

<style lang="postcss" scoped>
/* COLOR VARIANT */
.stacked-bar-segment {
  &.primary {
    --background-color: var(--color-info-item-base);
  }

  &.success {
    --background-color: var(--color-success-item-base);
  }

  &.warning {
    --background-color: var(--color-warning-item-base);
  }

  &.danger {
    --background-color: var(--color-danger-item-base);
  }
}

/* IMPLEMENTATION */
.stacked-bar-segment {
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
  color: var(--color-info-txt-item);
  background-color: var(--background-color);
  padding-inline: 0.8rem;
}

.hidden {
  visibility: hidden;
}
</style>
