<!-- v1.0 -->
<template>
  <div
    :aria-disabled="disabled || undefined"
    :class="[{ active, selected, disabled }, className]"
    class="menu-trigger"
    role="menuitem"
    tabindex="-1"
  >
    <VtsIcon :name="icon" size="medium" :busy />
    <slot />
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import type { MenuItemAccent } from '@core/components/menu/MenuItem.vue'
import type { IconName } from '@core/icons'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

const { accent } = defineProps<{
  accent: MenuItemAccent
  active?: boolean
  selected?: boolean
  busy?: boolean
  disabled?: boolean
  icon?: IconName
}>()

const className = computed(() => toVariants({ accent }))
</script>

<style lang="postcss" scoped>
.menu-trigger {
  position: relative;
  display: flex;
  align-items: center;
  padding-inline: 1.6rem;
  gap: 0.8rem;
  height: 4.5rem;

  &:focus-visible {
    outline: none;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border: 0.2rem solid var(--color-brand-txt-base);
      border-radius: 0.4rem;
    }
  }

  &.disabled {
    color: var(--color-neutral-txt-secondary);
    background-color: var(--color-neutral-background-disabled);
  }

  &:not(.disabled) {
    cursor: pointer;

    &.selected {
      background-color: var(--color-brand-background-selected);
    }

    &:hover {
      background-color: var(--color-brand-background-hover);
    }

    &:active,
    &.active {
      background-color: var(--color-brand-background-active);
    }

    &.accent--neutral {
      color: var(--color-neutral-txt-primary);
    }

    &.accent--brand {
      color: var(--color-brand-txt-base);

      &:hover {
        color: var(--color-brand-txt-hover);
      }

      &:active,
      &.active {
        color: var(--color-brand-txt-active);
      }
    }

    &.accent--danger {
      color: var(--color-danger-txt-base);

      &.selected {
        background-color: var(--color-danger-background-selected);
      }

      &:hover {
        color: var(--color-danger-txt-hover);
        background-color: var(--color-danger-background-hover);
      }

      &:active,
      &.active {
        color: var(--color-danger-txt-active);
        background-color: var(--color-danger-background-active);
      }
    }

    &.accent--warning {
      color: var(--color-warning-txt-base);

      &.selected {
        background-color: var(--color-warning-background-selected);
      }

      &:hover {
        color: var(--color-warning-txt-hover);
        background-color: var(--color-warning-background-hover);
      }

      &:active,
      &.active {
        color: var(--color-warning-txt-active);
        background-color: var(--color-warning-background-active);
      }
    }
  }
}
</style>
