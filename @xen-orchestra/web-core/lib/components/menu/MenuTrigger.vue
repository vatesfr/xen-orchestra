<!-- v1.0 -->
<template>
  <div :class="{ active, disabled }" class="menu-trigger">
    <UiIcon :busy="busy" :icon="icon" />
    <slot />
  </div>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

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
  background-color: var(--color-normal-txt-item);

  &.disabled {
    color: var(--color-neutral-border);
  }

  &:not(.disabled) {
    cursor: pointer;

    &:hover {
      background-color: var(--color-normal-background-selected);
    }

    &:active,
    &.active {
      background-color: var(--color-normal-background-hover);
    }
  }
}
</style>
