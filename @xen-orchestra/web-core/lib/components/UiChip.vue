<template>
  <span class="ui-chip typo p3-regular" :class="[color, { disabled }]">
    <span class="content" @click="emit('edit')">
      <slot name="icon">
        <UiIcon v-if="icon" :icon class="icon" fixed-width />
      </slot>
      <slot />
    </span>
    <UiIcon :icon="faCircleXmark" class="remove" @click.stop="emit('remove')" />
  </span>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import type { Color } from '@core/types/color.type'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons'

withDefaults(
  defineProps<{
    icon?: IconDefinition
    color?: Color
    disabled?: boolean
  }>(),
  { color: 'info' }
)

const emit = defineEmits<{
  (event: 'edit'): void
  (event: 'remove'): void
}>()
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.ui-chip {
  &.info {
    --color: var(--color-grey-100);
    --icon-color: var(--color-grey-200);
    --background-color: var(--background-color-purple-10);
    --remove-chip-color: var(--color-purple-base);

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-grey-100);
      --icon-color: var(--color-grey-200);
      --remove-chip-color: var(--color-purple-d20);
      --background-color: var(--background-color-purple-20);
    }

    &:is(:active, .pressed) {
      --color: var(--color-grey-100);
      --icon-color: var(--color-grey-200);
      --remove-chip-color: var(--color-purple-d40);
      --background-color: var(--background-color-purple-30);
    }

    &.disabled {
      --color: var(--color-grey-300);
      --icon-color: var(--color-grey-400);
      --remove-chip-color: var(--color-grey-400);
      --background-color: var(--background-color-secondary);
    }
  }

  &.success {
    --color: var(--color-grey-100);
    --icon-color: var(--color-grey-200);
    --background-color: var(--background-color-green-10);
    --remove-chip-color: var(--color-green-base);

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-grey-100);
      --icon-color: var(--color-grey-200);
      --remove-chip-color: var(--color-green-d20);
      --background-color: var(--background-color-green-20);
    }

    &:is(:active, .pressed) {
      --color: var(--color-grey-100);
      --icon-color: var(--color-grey-200);
      --remove-chip-color: var(--color-green-d40);
      --background-color: var(--background-color-green-30);
    }

    &.disabled {
      --color: var(--color-grey-600);
      --icon-color: var(--color-grey-600);
      --remove-chip-color: var(--color-grey-600);
      --background-color: var(--color-green-l60);
    }
  }

  &.warning {
    --color: var(--color-grey-100);
    --icon-color: var(--color-grey-200);
    --background-color: var(--background-color-orange-10);
    --remove-chip-color: var(--color-orange-base);

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-grey-100);
      --icon-color: var(--color-grey-200);
      --remove-chip-color: var(--color-orange-d20);
      --background-color: var(--background-color-orange-20);
    }

    &:is(:active, .pressed) {
      --color: var(--color-grey-100);
      --icon-color: var(--color-grey-200);
      --remove-chip-color: var(--color-orange-d40);
      --background-color: var(--background-color-orange-30);
    }

    &.disabled {
      --color: var(--color-grey-600);
      --icon-color: var(--color-grey-600);
      --remove-chip-color: var(--color-grey-600);
      --background-color: var(--color-orange-l60);
    }
  }

  &:is(.danger, .error) {
    --color: var(--color-grey-100);
    --icon-color: var(--color-grey-200);
    --background-color: var(--background-color-red-10);
    --remove-chip-color: var(--color-red-base);

    &:is(:hover, .hover, :focus-visible) {
      --color: var(--color-grey-100);
      --icon-color: var(--color-grey-200);
      --remove-chip-color: var(--color-red-d20);
      --background-color: var(--background-color-red-20);
    }

    &:is(:active, .pressed) {
      --color: var(--color-grey-100);
      --icon-color: var(--color-grey-200);
      --remove-chip-color: var(--color-red-d40);
      --background-color: var(--background-color-red-30);
    }

    &.disabled {
      --color: var(--color-grey-600);
      --icon-color: var(--color-grey-600);
      --remove-chip-color: var(--color-grey-600);
      --background-color: var(--color-red-l60);
    }
  }
}

/* IMPLEMENTATION */
.ui-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.4rem 0.8rem;
  border-radius: 10rem;
  color: var(--color);
  background-color: var(--background-color);
  cursor: pointer;

  &.disabled {
    pointer-events: none;
  }

  .content {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    white-space: nowrap;
  }

  .icon {
    color: var(--icon-color);
  }

  .remove {
    color: var(--remove-chip-color);
    padding: 0.2rem;
  }
}
</style>
