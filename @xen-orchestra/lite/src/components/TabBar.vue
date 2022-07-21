<template>
  <div class="tab-bar">
    <slot />
  </div>
</template>

<style lang="postcss" scoped>
.tab-bar {
  display: flex;
  align-items: stretch;
  height: 8rem;
  background-color: var(--background-color-primary);
  border-bottom: 1px solid var(--color-blue-scale-400);
}
</style>
