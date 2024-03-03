<template>
  <div :class="{ active, disabled }" class="menu-trigger">
    <UiIcon :busy :icon />
    <slot />
  </div>
</template>

<script lang="ts" setup>
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import UiIcon from '@/components/ui/icon/UiIcon.vue'

defineProps<{
  active?: boolean
  busy?: boolean
  disabled?: boolean
  icon?: IconDefinition
}>()
</script>

<style lang="postcss" scoped>
.menu-trigger {
  font-size: 1.6rem;
  font-weight: 400;
  display: flex;
  align-items: center;
  height: 4.4rem;
  padding-right: 1.5rem;
  padding-left: 1.5rem;
  white-space: nowrap;
  border-radius: 0.8rem;
  gap: 1rem;
  background-color: var(--color-grey-600);

  &.disabled {
    color: var(--color-grey-500);
  }

  &:not(.disabled) {
    cursor: pointer;

    &:hover {
      background-color: var(--background-color-secondary);
    }

    &:active,
    &.active {
      color: var(--color-purple-base);
      background-color: var(--background-color-purple-10);
    }
  }
}
</style>
