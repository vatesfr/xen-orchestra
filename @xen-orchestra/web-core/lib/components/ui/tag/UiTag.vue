<!-- v5 -->
<template>
  <span :class="className" class="ui-tag typo-body-regular-small">
    <slot />
  </span>
</template>

<script lang="ts" setup>
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

export type TagAccent = 'info' | 'neutral' | 'success' | 'warning' | 'danger' | 'muted'
type TagVariant = 'primary' | 'secondary'

const { accent, variant } = defineProps<{
  accent: TagAccent
  variant: TagVariant
}>()

defineSlots<{
  default(): any
}>()

const className = computed(() => toVariants({ accent, variant }))
</script>

<style lang="postcss" scoped>
.ui-tag {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.8rem;
  white-space: normal;
  word-break: break-word;
  padding: 0.35rem 0.8rem;
  vertical-align: middle;
  border-radius: 0.4rem;

  /* COLOR VARIANTS */

  &.accent--info {
    &.variant--primary {
      background-color: var(--color-info-item-base);
      color: var(--color-info-txt-item);
    }

    &.variant--secondary {
      background-color: var(--color-info-background-selected);
      color: var(--color-info-txt-base);
    }
  }

  &.accent--neutral {
    &.variant--primary {
      background-color: var(--color-neutral-txt-primary);
      color: var(--color-neutral-background-primary);
    }

    &.variant--secondary {
      background-color: var(--color-neutral-background-secondary);
      color: var(--color-neutral-txt-primary);
    }
  }

  &.accent--success {
    &.variant--primary {
      background-color: var(--color-success-item-base);
      color: var(--color-success-txt-item);
    }

    &.variant--secondary {
      background-color: var(--color-success-background-selected);
      color: var(--color-success-txt-base);
    }
  }

  &.accent--warning {
    &.variant--primary {
      background-color: var(--color-warning-item-base);
      color: var(--color-warning-txt-item);
    }

    &.variant--secondary {
      background-color: var(--color-warning-background-selected);
      color: var(--color-warning-txt-base);
    }
  }

  &.accent--danger {
    &.variant--primary {
      background-color: var(--color-danger-item-base);
      color: var(--color-danger-txt-item);
    }

    &.variant--secondary {
      background-color: var(--color-danger-background-selected);
      color: var(--color-danger-txt-base);
    }
  }

  &.accent--muted {
    &.variant--primary {
      background-color: var(--color-neutral-background-disabled);
      color: var(--color-neutral-txt-secondary);
    }

    &.variant--secondary {
      background-color: var(--color-neutral-background-secondary);
      color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
