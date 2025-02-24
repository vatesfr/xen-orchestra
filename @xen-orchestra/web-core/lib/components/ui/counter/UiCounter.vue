<!-- v3 -->
<template>
  <span :class="classNames" class="ui-counter">
    <span class="inner">{{ value }}</span>
  </span>
</template>

<script lang="ts" setup>
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

type CounterAccent = 'brand' | 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted'
type CounterVariant = 'primary' | 'secondary'
type CounterSize = 'small' | 'medium'

const { size, accent, variant } = defineProps<{
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
    typoClasses[size],
    toVariants({
      accent,
      variant,
      size,
    }),
  ]
})
</script>

<style lang="postcss" scoped>
.ui-counter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  text-transform: lowercase;

  .inner {
    line-height: 0;
  }

  /* VARIANT + ACCENT VARIANTS */

  &.variant--primary {
    &.accent--brand {
      background-color: var(--color-brand-item-base);
      color: var(--color-brand-txt-item);
    }

    &.accent--neutral {
      background-color: var(--color-neutral-txt-primary);
      color: var(--color-neutral-background-primary);
    }

    &.accent--info {
      background-color: var(--color-info-item-base);
      color: var(--color-info-txt-item);
    }

    &.accent--success {
      background-color: var(--color-success-item-base);
      color: var(--color-success-txt-item);
    }

    &.accent--warning {
      background-color: var(--color-warning-item-base);
      color: var(--color-warning-txt-item);
    }

    &.accent--danger {
      background-color: var(--color-danger-item-base);
      color: var(--color-danger-txt-item);
    }

    &.accent--muted {
      background-color: var(--color-neutral-background-disabled);
      color: var(--color-neutral-txt-secondary);
    }
  }

  &.variant--secondary {
    &.accent--brand {
      background-color: var(--color-brand-background-selected);
      color: var(--color-brand-txt-base);
    }

    &.accent--info {
      background-color: var(--color-info-background-selected);
      color: var(--color-info-txt-base);
    }

    &.accent--neutral {
      background-color: var(--color-neutral-background-secondary);
      color: var(--color-neutral-txt-secondary);
    }

    &.accent--success {
      background-color: var(--color-success-background-selected);
      color: var(--color-success-txt-base);
    }

    &.accent--warning {
      background-color: var(--color-warning-background-selected);
      color: var(--color-warning-txt-base);
    }

    &.accent--danger {
      background-color: var(--color-danger-background-selected);
      color: var(--color-danger-txt-base);
    }

    &.accent--muted {
      background-color: var(--color-neutral-background-secondary);
      color: var(--color-neutral-txt-secondary);
    }
  }

  /* SIZE VARIANTS */

  &.size--small {
    height: 1.5rem;
    min-width: 1.5rem;
    border-radius: calc(1.5rem / 2);
    padding: 0 0.4rem;
  }

  &.size--medium {
    height: 2.4rem;
    min-width: 2.4rem;
    border-radius: calc(2.4rem / 2);
    padding: 0 0.6rem;
  }
}
</style>
