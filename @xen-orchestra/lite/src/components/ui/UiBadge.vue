<template>
  <span class="ui-badge">
    <slot />
  </span>
</template>

<style lang="postcss" scoped>
.ui-badge {
  font-size: 1.2rem;
  font-weight: 500;
  line-height: 100%;
  padding: 0.1rem 0.5rem;
  color: var(--color-blue-scale-500);
  border-radius: 9.6rem;
  background-color: var(--color-blue-scale-300);
}
</style>
