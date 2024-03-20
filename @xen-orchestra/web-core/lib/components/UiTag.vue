<template>
  <span class="ui-tag typo p3-regular" :class="[color, { light }]">
    <slot name="icon">
      <UiIcon :icon fixed-width />
    </slot>
    <slot />
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
  &.grey {
    --color: var(--color-grey-600);
    --background-color: var(--color-grey-300);

    &.light {
      --color: var(--color-grey-100);
      --background-color: var(--background-color-secondary);
    }
  }

  &.info {
    --color: var(--color-grey-600);
    --background-color: var(--color-purple-l20);

    &.light {
      --color: var(--color-grey-100);
      --background-color: var(--background-color-purple-10);
    }
  }

  &.success {
    --color: var(--color-grey-600);
    --background-color: var(--color-green-l20);

    &.light {
      --color: var(--color-grey-100);
      --background-color: var(--background-color-green-10);
    }
  }

  &.warning {
    --color: var(--color-grey-600);
    --background-color: var(--color-orange-l20);

    &.light {
      --color: var(--color-grey-100);
      --background-color: var(--background-color-orange-10);
    }
  }

  &:is(.error, .danger) {
    --color: var(--color-grey-600);
    --background-color: var(--color-red-l20);

    &.light {
      --color: var(--color-grey-100);
      --background-color: var(--background-color-red-10);
    }
  }
}

/* IMPLEMENTATION */
.ui-tag {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 0.8rem;
  white-space: nowrap;
  color: var(--color);
  background-color: var(--background-color);
  padding: 0.2rem 0.8rem;
  border-radius: 0.4rem;
}
</style>
