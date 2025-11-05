<!-- v1.0 -->
<template>
  <div :class="{ active, disabled }" class="menu-trigger">
    <VtsIcon :name="icon" size="medium" :busy />
    <slot />
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import type { IconName } from '@core/icons'

defineProps<{
  active?: boolean
  busy?: boolean
  disabled?: boolean
  icon?: IconName
}>()
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
  }
}
</style>
