<template>
  <div
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
import type { Color } from '@core/types/color.type'
import { hasEllipsis } from '@core/utils/has-ellipsis.util'
import { useResizeObserver } from '@vueuse/core'
import { ref } from 'vue'

defineProps<{
  color: Color
  percentage: number
}>()

const hidden = ref(false)
const ellipsisElement = ref<HTMLElement | null>(null)

useResizeObserver(ellipsisElement, ([entry]) => {
  hidden.value = hasEllipsis(entry.target)
})
</script>

<style lang="postcss" scoped>
/* COLOR VARIANT */
.stacked-bar-segment {
  &.info {
    --background-color: var(--color-purple-base);
  }

  &.success {
    --background-color: var(--color-green-base);
  }

  &.warning {
    --background-color: var(--color-orange-base);
  }

  &.error {
    --background-color: var(--color-red-base);
  }
}

/* IMPLEMENTATION */
.stacked-bar-segment {
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
  color: var(--color-grey-600);
  background-color: var(--background-color);
}

.hidden {
  visibility: hidden;
}
</style>
