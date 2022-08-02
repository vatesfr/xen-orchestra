<template>
  <ul class="ui-menu">
    <slot />
  </ul>
</template>

<script lang="ts" setup></script>

<style scoped>
.ui-menu {
  display: inline-flex;
  flex-direction: column;
  color: var(--color-blue-scale-200);
  border-radius: 0.8rem;
  background-color: var(--color-blue-scale-500);
  box-shadow: var(--shadow-300);
  gap: 0.5rem;
  cursor: default;
}
</style>
