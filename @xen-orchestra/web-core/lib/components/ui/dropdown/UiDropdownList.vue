<template>
  <div class="ui-dropdown-list">
    <slot />
  </div>
</template>

<style lang="postcss" scoped>
.ui-dropdown-list {
  display: flex;
  flex-direction: column;
  overflow: auto;
  background: var(--color-neutral-background-primary);
  border: 0.1rem solid var(--color-neutral-border);
  border-radius: 0.4rem;
}
</style>
