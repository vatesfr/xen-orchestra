<!-- v1.2 -->
<template>
  <span :class="[color, { light }]" class="ui-tag typo p3-regular">
    <slot name="icon">
      <UiIcon :icon fixed-width />
    </slot>
    <span class="text-ellipsis"><slot /></span>
  </span>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import type { TagColor } from '@core/types/color.type'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

withDefaults(
  defineProps<{
    color?: TagColor
    light?: boolean
    icon?: IconDefinition
  }>(),
  { color: 'grey' }
)
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.ui-tag {
  --color: var(--color-normal-txt-item);

  &.light {
    --color: var(--color-neutral-txt-primary);
  }
}

/* BACKGROUND COLOR VARIANTS */
.ui-tag {
  &.grey {
    --background-color: var(--color-neutral-txt-secondary);

    &.light {
      --background-color: var(--color-neutral-background-secondary);
    }
  }

  &.info {
    --background-color: var(--color-normal-item-hover);

    &.light {
      --background-color: var(--color-normal-background-selected);
    }
  }

  &.success {
    --background-color: var(--color-success-item-hover);

    &.light {
      --background-color: var(--color-success-background-selected);
    }
  }

  &.warning {
    --background-color: var(--color-warning-item-hover);

    &.light {
      --background-color: var(--color-warning-background-selected);
    }
  }

  &:is(.error, .danger) {
    --background-color: var(--color-danger-item-hover);

    &.light {
      --background-color: var(--color-danger-background-selected);
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
