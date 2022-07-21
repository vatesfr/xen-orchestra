<template>
  <div class="ui-card">
    <slot />
  </div>
</template>

<style lang="postcss" scoped>
.ui-card {
  padding: 2.1rem;
  border-radius: 0.8rem;
  background-color: var(--background-color-primary);
  box-shadow: var(--shadow-200);
}
</style>
