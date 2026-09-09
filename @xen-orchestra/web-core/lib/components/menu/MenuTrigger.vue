<!-- v1.0 -->
<template>
  <div :class="[{ active, disabled }, className]" class="menu-trigger">
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
  accent?: MenuItemAccent
  active?: boolean
  busy?: boolean
  disabled?: boolean
  icon?: IconName
}>()

const className = computed(() => toVariants({ accent }))
</script>

<style lang="postcss" scoped>
.menu-trigger {
  display: flex;
  align-items: center;
  padding-inline: 1.6rem;
  gap: 0.8rem;
  height: 4.5rem;

  &.disabled {
    color: var(--color-neutral-txt-secondary);
    background-color: var(--color-neutral-background-disabled);
  }

  &:not(.disabled) {
    cursor: pointer;

    &:hover {
      background-color: var(--color-brand-background-hover);
    }

    &:active,
    &.active {
      background-color: var(--color-brand-background-active);
    }

    &.accent--danger {
      &:hover {
        background-color: var(--color-danger-background-hover);
      }

      &:active,
      &.active {
        background-color: var(--color-danger-background-active);
      }
    }

    &.accent--warning {
      &:hover {
        background-color: var(--color-warning-background-hover);
      }

      &:active,
      &.active {
        background-color: var(--color-warning-background-active);
      }
    }
  }
}
</style>
