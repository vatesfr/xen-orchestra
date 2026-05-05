<!-- v5 -->
<template>
  <span v-if="variant === 'tertiary'" class="tertiary">
    <UiTag :accent variant="primary">
      <slot name="term">{{ term }}</slot>
    </UiTag>
    <UiTag :accent variant="secondary">
      <span>
        <slot />
      </span>
    </UiTag>
  </span>
  <span v-else :class="className" class="ui-tag rounded typo-body-regular-small">
    <span>
      <slot />
    </span>
  </span>
</template>

<script lang="ts" setup>
import type { IconName } from '@core/icons'
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

type TagAccent = 'info' | 'neutral' | 'success' | 'warning' | 'danger' | 'muted'
type TagVariant = 'primary' | 'secondary' | 'tertiary'

const { accent, variant } = defineProps<{
  accent: TagAccent
  variant: TagVariant
  icon?: IconName
  term?: string
}>()

defineSlots<{
  default(): any
  term?(): any
}>()

const className = computed(() => toVariants({ accent, variant }))
</script>

<style lang="postcss" scoped>
.tertiary {
  display: flex;
  flex-direction: row;

  .ui-tag:first-child {
    border-radius: 0.4rem 0 0 0.4rem;
    width: 100%;
  }

  .ui-tag:last-child {
    border-radius: 0 0.4rem 0.4rem 0;
    width: 100%;
  }
}

.ui-tag {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.8rem;
  white-space: normal;
  word-break: break-word;
  padding: 0.35rem 0.8rem;
  vertical-align: middle;

  &.rounded {
    border-radius: 0.4rem;
  }

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
