<!-- v1.0 -->
<template>
  <span :class="classNames" class="ui-counter typo">
    <span class="inner">{{ value }}</span>
  </span>
</template>

<script lang="ts" setup>
import type { CounterColor } from '@core/types/color.type'
import type { CounterSize } from '@core/types/size.type'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number | string
    color: CounterColor
    size?: CounterSize
  }>(),
  { size: 'small' }
)

const fontClasses = {
  small: 'p4-semi-bold',
  medium: 'p1-medium',
}

const classNames = computed(() => {
  return [props.color, props.size, fontClasses[props.size]]
})
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.ui-counter {
  &.primary {
    --background-color: var(--color-normal-item-base);
    --color: var(--color-normal-txt-item);
  }

  &.secondary {
    --background-color: var(--color-neutral-txt-primary);
    --color: var(--color-neutral-background-primary);
  }

  &.success {
    --background-color: var(--color-success-item-base);
    --color: var(--color-success-txt-item);
  }

  &.warning {
    --background-color: var(--color-warning-item-base);
    --color: var(--color-warning-txt-item);
  }

  &.danger {
    --background-color: var(--color-danger-item-base);
    --color: var(--color-danger-txt-item);
  }

  &.disabled {
    --background-color: var(--color-neutral-background-disabled);
    --color: var(--color-neutral-txt-secondary);
  }
}

/* SIZE VARIANTS */
.ui-counter {
  &.small {
    --height: 1.5rem;
    --padding: 0 0.4rem;
  }

  &.medium {
    --height: 2.4rem;
    --padding: 0 0.6rem;
  }
}

/* IMPLEMENTATION */
.ui-counter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  text-transform: lowercase;
  color: var(--color);
  height: var(--height);
  min-width: var(--height);
  padding: var(--padding);
  background-color: var(--background-color);
  border-radius: calc(var(--height) / 2);

  .inner {
    line-height: 0;
  }
}
</style>
