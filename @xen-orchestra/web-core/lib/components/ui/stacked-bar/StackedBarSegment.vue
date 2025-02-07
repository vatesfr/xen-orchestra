<template>
  <div
    v-if="percentage > 0"
    v-tooltip="{ selector: '.text-ellipsis' }"
    :class="`accent--${accent}`"
    :style="{ width: percentage + '%' }"
    class="stacked-bar-segment typo-caption-small"
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

export type StackedBarSegmentAccent = 'info' | 'success' | 'warning' | 'danger'

export type StackedBarSegmentProps = {
  accent: StackedBarSegmentAccent
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
.stacked-bar-segment {
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
  color: var(--color-info-txt-item);
  padding-inline: 0.8rem;

  .hidden {
    visibility: hidden;
  }

  /* ACCENT VARIANTS */

  &.accent--info {
    background-color: var(--color-info-item-base);
  }

  &.accent--success {
    background-color: var(--color-success-item-base);
  }

  &.accent--warning {
    background-color: var(--color-warning-item-base);
  }

  &.accent--danger {
    background-color: var(--color-danger-item-base);
  }
}
</style>
