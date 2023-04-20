<template>
  <component
    :is="tag"
    :class="{ active, disabled: disabled || isTabBarDisabled }"
    class="ui-tab"
  >
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { type ComputedRef, computed, inject } from "vue";

withDefaults(
  defineProps<{
    disabled?: boolean;
    active?: boolean;
    tag?: string;
  }>(),
  { tag: "span" }
);

const isTabBarDisabled = inject<ComputedRef<boolean>>(
  "isTabBarDisabled",
  computed(() => false)
);
</script>

<style lang="postcss" scoped>
.ui-tab {
  font-size: 1.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  padding: 0 1.2em;
  text-decoration: none;
  text-transform: uppercase;
  color: var(--color-blue-scale-100);
  border-bottom: 2px solid transparent;

  &.disabled {
    pointer-events: none;
    color: var(--color-blue-scale-400);
  }

  &:not(.disabled) {
    cursor: pointer;

    &:hover {
      cursor: pointer;
      border-bottom-color: var(--color-extra-blue-base);
      background-color: var(--background-color-secondary);
    }

    &:active {
      color: var(--color-extra-blue-base);
      border-bottom-color: var(--color-extra-blue-base);
      background-color: var(--background-color-secondary);
    }

    &.active {
      color: var(--color-extra-blue-base);
      border-bottom-color: var(--color-extra-blue-base);
      background-color: var(--background-color-primary);
    }
  }
}
</style>
