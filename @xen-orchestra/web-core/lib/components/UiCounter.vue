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
/* COLOR VARIANTS */
.ui-counter {
  --background-color: var(--color-grey-300);

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

/* SIZE VARIANTS */
.ui-counter {
  & {
    --font-size: 1rem;
    --font-weight: 600;
    --min-width: 1.5rem;
    --padding: 0 0.6rem;
  }

  &.large {
    --font-size: 1.6rem;
    --font-weight: 500;
    --min-width: 2.4rem;
    --padding: 0 0.8rem;
  }
}

/* IMPLEMENTATION */
.ui-counter {
  display: inline-flex;
  align-items: center;
  color: var(--color-grey-600);
  border-radius: 9rem;
  text-transform: lowercase;
  background-color: var(--background-color);
  font-size: var(--font-size);
  font-weight: var(--font-weight);
  min-width: var(--min-width);
  padding: var(--padding);
}
</style>
