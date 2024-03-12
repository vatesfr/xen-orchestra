<template>
  <span :class="[color, size]" class="ui-counter">
    <span class="value" :class="{ overflow: value > 99 }">
      {{ value }}
    </span>
  </span>
</template>

<script lang="ts" setup>
import type { Color } from '@core/types/color.type'

defineProps<{
  value: number
  color?: Color | 'black'
  size?: 'small' | 'medium'
}>()
</script>

<style lang="postcss" scoped>
.ui-counter {
  font-weight: 500;
  font-size: 1.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--size);
  color: var(--color-grey-600);
  border-radius: calc(var(--size) / 2);
  background-color: var(--background-color);
  min-width: 1.9rem;
  --background-color: var(--color-grey-300);
  --size: 2.4rem;

  &.small {
    --size: 1.5rem;
    font-size: 1rem;
    font-weight: 600;
  }

  .value {
    padding: 0 0.4rem;
  }

  .overflow {
    font-size: 0.8em;
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
