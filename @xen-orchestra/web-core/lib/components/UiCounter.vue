<template>
  <span :class="[color, { large }]" class="ui-counter">{{ value }}{{ suffix }}</span>
</template>

<script lang="ts" setup>
import type { Color } from '@core/types/color.type'

defineProps<{
  value: number
  color?: Color | 'black'
  suffix?: string
  large?: boolean
}>()
</script>

<style lang="postcss" scoped>
.ui-counter {
  font-weight: 600;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  color: var(--color-grey-600);
  border-radius: 9rem;
  background-color: var(--background-color);
  min-width: var(--size);
  padding: 0 0.6rem;
  text-transform: lowercase;
  --size: 1.5rem;
  --background-color: var(--color-grey-300);

  &.large {
    --size: 2.4rem;
    font-size: 1.6rem;
    font-weight: 500;
    padding: 0 0.8rem;
  }

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

  &.black {
    --background-color: var(--color-grey-100);
  }
}
</style>
