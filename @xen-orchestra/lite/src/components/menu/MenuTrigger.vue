<template>
  <div :class="[{ active, disabled }, color]" class="menu-trigger">
    <UiIcon :busy="busy" :icon="icon" />
    <slot />
  </div>
</template>

<script lang="ts" setup>
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import UiIcon from "@/components/ui/UiIcon.vue";
import type { Color } from "@/types";

defineProps<{
  active?: boolean;
  busy?: boolean;
  color?: Color;
  disabled?: boolean;
  icon?: IconDefinition;
}>();
</script>

<style lang="postcss" scoped>
.menu-trigger {
  font-size: 1.6rem;
  font-weight: 400;
  display: flex;
  align-items: center;
  height: 4.4rem;
  padding-right: 1.5rem;
  padding-left: 1rem;
  white-space: nowrap;
  border-radius: 0.8rem;
  gap: 1rem;
  color: var(--menu-trigger-color);
  background-color: var(--menu-trigger-bg-color);

  &.disabled {
    --menu-trigger-color: var(--color-blue-scale-400);
  }

  &:not(.disabled) {
    cursor: pointer;

    &:hover {
      background-color: var(
        --menu-trigger-bg-color-hover,
        --background-color-secondary
      );
    }

    &:active,
    &.active {
      background-color: var(
        --menu-trigger-bg-color-active,
        --background-color-extra-blue
      );
    }

    &.info {
      --menu-trigger-bg-color: var(--color-extra-blue-base);
      --menu-trigger-bg-color-hover: var(--color-extra-blue-d20);
      --menu-trigger-bg-color-active: var(--color-extra-blue-d40);
      --menu-trigger-color: var(--color-blue-scale-500);
    }

    &.error {
      --menu-trigger-bg-color: var(--color-red-vates-base);
      --menu-trigger-bg-color-hover: var(--color-red-vates-d20);
      --menu-trigger-bg-color-active: var(--color-red-vates-d40);
      --menu-trigger-color: var(--color-blue-scale-500);
    }

    &.warning {
      --menu-trigger-bg-color: var(--color-orange-world-base);
      --menu-trigger-bg-color-hover: var(--color-orange-world-d20);
      --menu-trigger-bg-color-active: var(--color-orange-world-d40);
      --menu-trigger-color: var(--color-blue-scale-500);
    }

    &.success {
      --menu-trigger-bg-color: var(--color-green-infra-base);
      --menu-trigger-bg-color-hover: var(--color-green-infra-d20);
      --menu-trigger-bg-color-active: var(--color-green-infra-d40);
      --menu-trigger-color: var(--color-blue-scale-500);
    }
  }
}
</style>
