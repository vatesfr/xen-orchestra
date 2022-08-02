<template>
  <li :class="{ disabled, active }" class="ui-menu-item">
    <slot />
  </li>
</template>

<script lang="ts" setup>
defineProps<{
  disabled?: boolean;
  active?: boolean;
}>();
</script>

<style scoped>
.ui-menu-item {
  font-size: 1.6rem;
  font-weight: 400;
  display: flex;
  align-items: center;
  height: 4.4rem;
  margin: 0 1rem;
  padding: 1rem 1.5rem 1rem 1rem;
  white-space: nowrap;
  color: var(--color-blue-scale-100);
  border-radius: 0.8rem;
  gap: 1rem;

  &:first-child {
    margin-top: 1rem;
  }

  &:last-child {
    margin-bottom: 1rem;
  }

  &.disabled {
    color: var(--color-blue-scale-400);
  }

  &:not(.disabled) {
    cursor: pointer;

    &:hover {
      background-color: var(--background-color-secondary);
    }

    &:active,
    &.active {
      color: var(--color-extra-blue-base);
      background-color: var(--background-color-extra-blue);
    }
  }
}
</style>
