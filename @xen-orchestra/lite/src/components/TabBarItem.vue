<template>
  <span v-if="disabled" class="tab-bar-item disabled">
    <slot />
  </span>
  <RouterLink v-else class="tab-bar-item" v-bind="$props">
    <slot />
  </RouterLink>
</template>

<script lang="ts" setup>
import type { RouterLinkProps } from "vue-router";

// https://vuejs.org/api/sfc-script-setup.html#type-only-props-emit-declarations
interface Props extends RouterLinkProps {
  disabled?: boolean;
}

defineProps<Props>();
</script>

<style lang="postcss" scoped>
.tab-bar-item {
  font-size: 2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  padding: 0 2.5rem;
  text-decoration: none;
  text-transform: uppercase;
  color: var(--color-blue-scale-100);
  border-bottom: 2px solid transparent;

  &:hover:not(.disabled) {
    border-bottom-color: var(--color-extra-blue-base);
    background-color: var(--background-color-secondary);
  }

  &:active:not(.disabled) {
    color: var(--color-extra-blue-base);
    border-bottom-color: var(--color-extra-blue-base);
    background-color: var(--background-color-secondary);
  }

  &.router-link-active {
    color: var(--color-extra-blue-base);
    border-bottom-color: var(--color-extra-blue-base);
    background-color: var(--background-color-primary);
  }

  &.disabled {
    color: var(--color-blue-scale-400);
  }
}
</style>
