<template>
  <li class="tree-item-error">
    <slot />
  </li>
</template>

<style lang="postcss" scoped>
.tree-item-error {
  padding-left: 3rem;
  font-weight: 700;
  font-size: 1.6rem;
  line-height: 150%;
  color: var(--color-red-base);
}
</style>
