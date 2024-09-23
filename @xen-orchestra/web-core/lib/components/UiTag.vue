<!-- v1.2 -->
<template>
  <span :class="[color, { light }]" class="ui-tag typo p3-regular">
    <slot name="icon">
      <UiIcon :icon color="current" fixed-width />
    </slot>
    <span class="text-ellipsis"><slot /></span>
  </span>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import type { TagColor } from '@core/types/color.type'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

defineProps<{
  color: TagColor
  light?: boolean
  icon?: IconDefinition
}>()
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.ui-tag {
  &.primary {
    --background-color: var(--color-normal-item-base);
    --color: var(--color-normal-txt-item);

    &.light {
      --background-color: var(--color-normal-background-selected);
      --color: var(--color-normal-txt-base);
    }
  }

  &.secondary {
    --background-color: var(--color-neutral-txt-primary);
    --color: var(--color-neutral-background-primary);

    &.light {
      --background-color: var(--color-neutral-background-secondary);
      --color: var(--color-neutral-txt-primary);
    }
  }

  &.success {
    --background-color: var(--color-success-item-base);
    --color: var(--color-success-txt-item);

    &.light {
      --background-color: var(--color-success-background-selected);
      --color: var(--color-success-txt-base);
    }
  }

  &.warning {
    --background-color: var(--color-warning-item-base);
    --color: var(--color-warning-txt-item);

    &.light {
      --background-color: var(--color-warning-background-selected);
      --color: var(--color-warning-txt-base);
    }
  }

  &.danger {
    --background-color: var(--color-danger-item-base);
    --color: var(--color-danger-txt-item);

    &.light {
      --background-color: var(--color-danger-background-selected);
      --color: var(--color-danger-txt-base);
    }
  }

  &.disabled {
    --background-color: var(--color-neutral-background-disabled);
    --color: var(--color-neutral-txt-secondary);

    &.light {
      --background-color: var(--color-neutral-background-secondary);
      --color: var(--color-neutral-txt-secondary);
    }
  }
}

/* IMPLEMENTATION */
.ui-tag {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.8rem;
  white-space: nowrap;
  color: var(--color);
  background-color: var(--background-color);
  padding: 0.2rem 0.8rem;
  border-radius: 0.4rem;
  vertical-align: middle;
  min-width: 0;
}
</style>
