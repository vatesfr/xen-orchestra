<template>
  <li class="legend">
    <span class="ellipsis" :class="legend.color"></span><span class="label">{{ legend.label }}</span
    ><UiIcon :icon="legend.info ? faCircleInfo : undefined" color="info" class="ui-icon" />

    <span class="value">{{ legend.value }}</span>
    <span class="unit">{{ legend.unit }}</span>
  </li>
</template>
<script setup lang="ts">
import type { Color } from '@core/types/color.type.ts'
import UiIcon from '@core/components/icon/UiIcon.vue'
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  legend: {
    value: number
    color: Color | 'dark-blue' | 'disabled'
    label: string
    unit?: string
    info?: boolean
  }
}>()
</script>
<style lang="postcss" scoped>
.legend {
  display: flex;
  align-items: center;
  gap: 0.8rem;

  & .ellipsis {
    width: 0.8rem;
    height: 0.8rem;
    min-width: 0.8rem;
    border-radius: 50%;

    &.default {
      background-color: var(--color-purple-base);
    }
    &.success {
      background-color: var(--color-green-base);
    }
    &.warning {
      background-color: var(--color-orange-base);
    }
    &.error {
      background-color: var(--color-red-base);
    }
    &.disabled {
      background-color: var(--color-grey-300);
    }
    &.dark-blue {
      background-color: var(--color-grey-100);
    }
  }

  & .label {
    font-size: 1.3rem;
    font-weight: 400;
    color: var(--color-grey-000);
  }

  & .ui-icon {
    font-size: 1.2rem;
  }

  & .value,
  & .unit {
    font-weight: 600;
    font-size: 1.3rem;
    color: var(--color-grey-300);
  }

  & .value {
    margin-left: auto;
  }
}
</style>
