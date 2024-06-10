<template>
  <div class="ui-filter-group">
    <slot />
  </div>
</template>

<style lang="postcss" scoped>
.ui-filter-group {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: var(--background-color-primary);
  gap: 1rem;
}
</style>
