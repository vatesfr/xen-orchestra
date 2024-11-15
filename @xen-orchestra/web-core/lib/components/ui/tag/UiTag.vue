<!-- v3 -->
<!-- TODO: implement tertiary variant to bump to v4 -->
<template>
  <span :class="toVariants({ accent, variant })" class="ui-tag typo p3-regular">
    <slot name="icon">
      <VtsIcon :icon accent="current" fixed-width />
    </slot>
    <span class="text-ellipsis"><slot /></span>
  </span>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { toVariants } from '@core/utils/to-variants.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

type TagAccent = 'info' | 'neutral' | 'success' | 'warning' | 'danger' | 'muted'
type TagVariant = 'primary' | 'secondary'

defineProps<{
  accent: TagAccent
  variant: TagVariant
  icon?: IconDefinition
}>()

defineSlots<{
  default(): any
  icon?(): any
}>()
</script>

<style lang="postcss" scoped>
.ui-tag {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.8rem;
  white-space: nowrap;
  padding: 0.2rem 0.8rem;
  border-radius: 0.4rem;
  vertical-align: middle;
  min-width: 0;

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
