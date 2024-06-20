<!-- v1.0 -->
<template>
  <li :class="color" class="ui-legend">
    <UiIcon :icon="faCircle" class="circle-icon" />
    <span class="label typo p3-regular"><slot /></span>
    <UiIcon v-if="tooltip" v-tooltip="tooltip" :icon="faCircleInfo" class="tooltip-icon" color="info" />

    <span class="value-and-unit typo c3-semi-bold">{{ value }} {{ unit }}</span>
  </li>
</template>

<script setup lang="ts">
import UiIcon from '@core/components/icon/UiIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCircleInfo, faCircle } from '@fortawesome/free-solid-svg-icons'

type LegendColor = 'default' | 'success' | 'warning' | 'error' | 'disabled' | 'dark-blue'

defineProps<{
  color: LegendColor
  value?: number
  unit?: string
  tooltip?: string
}>()
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.ui-legend {
  &.success {
    --circle-color: var(--color-green-base);
  }
  &.warning {
    --circle-color: var(--color-orange-base);
  }
  &.error {
    --circle-color: var(--color-red-base);
  }
  &.default {
    --circle-color: var(--color-purple-base);
  }
  &.disabled {
    --circle-color: var(--color-grey-300);
  }
  &.dark-blue {
    --circle-color: var(--color-grey-100);
  }
}
/* IMPLEMENTATION */
.ui-legend {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.circle-icon {
  font-size: 0.8rem;
  color: var(--circle-color);
}
.tooltip-icon {
  font-size: 1.2rem;
}
.label {
  color: var(--color-grey-000);
}
.value-and-unit {
  color: var(--color-grey-300);
}
</style>
