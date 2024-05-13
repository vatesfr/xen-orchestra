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
    color?: CounterColor
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

  &:is(.error, .danger) {
    --background-color: var(--color-red-base);
  }

  &.black {
    --background-color: var(--color-grey-100);
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
  color: var(--color-grey-600);
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
