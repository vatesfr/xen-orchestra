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
  --color: var(--color-grey-600);

  &.light {
    --color: var(--color-grey-100);
  }
}

/* BACKGROUND COLOR VARIANTS */
.ui-tag {
  &.grey {
    --background-color: var(--color-grey-300);

    &.light {
      --background-color: var(--background-color-secondary);
    }
  }

  &.info {
    --background-color: var(--color-purple-l20);

    &.light {
      --background-color: var(--background-color-purple-10);
    }
  }

  &.success {
    --background-color: var(--color-green-l20);

    &.light {
      --background-color: var(--background-color-green-10);
    }
  }

  &.warning {
    --background-color: var(--color-orange-l20);

    &.light {
      --background-color: var(--background-color-orange-10);
    }
  }

  &:is(.error, .danger) {
    --background-color: var(--color-red-l20);

    &.light {
      --background-color: var(--background-color-red-10);
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
