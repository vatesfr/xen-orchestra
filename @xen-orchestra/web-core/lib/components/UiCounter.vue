<template>
  <span :class="classNames" class="ui-counter typo">{{ value }}{{ suffix }}</span>
</template>

<script lang="ts" setup>
import type { CounterColor } from '@core/types/color.type'
import type { CounterSize } from '@core/types/size.type'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    color?: CounterColor
    size?: CounterSize
    suffix?: string
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
    --min-width: 1.5rem;
    --padding: 0 0.6rem;
  }

  &.medium {
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
  min-width: var(--min-width);
  padding: var(--padding);
}
</style>
