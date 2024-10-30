<!-- v2 -->
<template>
  <span :class="classNames" class="vts-counter">
    <span class="inner">{{ value }}</span>
  </span>
</template>

<script lang="ts" setup>
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

type CounterAccent = 'info' | 'neutral' | 'success' | 'warning' | 'danger' | 'muted'
type CounterVariant = 'primary' | 'secondary'
type CounterSize = 'small' | 'medium'

const props = defineProps<{
  value: number | string
  accent: CounterAccent
  variant: CounterVariant
  size: CounterSize
}>()

const typoClasses = {
  small: 'typo p4-semi-bold',
  medium: 'typo p1-medium',
}

const classNames = computed(() => {
  return [
    typoClasses[props.size],
    toVariants({
      accent: props.accent,
      variant: props.variant,
      size: props.size,
    }),
  ]
})
</script>

<style lang="postcss" scoped>
/*
VARIANT + ACCENT
--vts-counter--background-color
--vts-counter--color
*/
.vts-counter {
  &.variant--primary {
    &.accent--info {
      --vts-counter--background-color: var(--color-info-item-base);
      --vts-counter--color: var(--color-info-txt-item);
    }

    &.accent--neutral {
      --vts-counter--background-color: var(--color-neutral-txt-primary);
      --vts-counter--color: var(--color-neutral-background-primary);
    }

    &.accent--success {
      --vts-counter--background-color: var(--color-success-item-base);
      --vts-counter--color: var(--color-success-txt-item);
    }

    &.accent--warning {
      --vts-counter--background-color: var(--color-warning-item-base);
      --vts-counter--color: var(--color-warning-txt-item);
    }

    &.accent--danger {
      --vts-counter--background-color: var(--color-danger-item-base);
      --vts-counter--color: var(--color-danger-txt-item);
    }

    &.accent--muted {
      --vts-counter--background-color: var(--color-neutral-background-disabled);
      --vts-counter--color: var(--color-neutral-txt-secondary);
    }
  }

  &.variant--secondary {
    &.accent--info {
      --vts-counter--background-color: var(--color-info-background-selected);
      --vts-counter--color: var(--color-info-txt-base);
    }

    &.accent--neutral {
      --vts-counter--background-color: var(--color-neutral-background-secondary);
      --vts-counter--color: var(--color-neutral-txt-secondary);
    }

    &.accent--success {
      --vts-counter--background-color: var(--color-success-background-selected);
      --vts-counter--color: var(--color-success-txt-base);
    }

    &.accent--warning {
      --vts-counter--background-color: var(--color-warning-background-selected);
      --vts-counter--color: var(--color-warning-txt-base);
    }

    &.accent--danger {
      --vts-counter--background-color: var(--color-danger-background-selected);
      --vts-counter--color: var(--color-danger-txt-base);
    }

    &.accent--muted {
      --vts-counter--background-color: var(--color-neutral-background-secondary);
      --vts-counter--color: var(--color-neutral-txt-secondary);
    }
  }
}

/*
SIZE
--vts-counter--height
--vts-counter--padding
*/
.vts-counter {
  &.size--small {
    --vts-counter--height: 1.5rem;
    --vts-counter--padding: 0 0.4rem;
  }

  &.size--medium {
    --vts-counter--height: 2.4rem;
    --vts-counter--padding: 0 0.6rem;
  }
}

/* IMPLEMENTATION */
.vts-counter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  text-transform: lowercase;
  color: var(--vts-counter--color);
  height: var(--vts-counter--height);
  min-width: var(--vts-counter--height);
  padding: var(--vts-counter--padding);
  background-color: var(--vts-counter--background-color);
  border-radius: calc(var(--vts-counter--height) / 2);

  .inner {
    line-height: 0;
  }
}
</style>
