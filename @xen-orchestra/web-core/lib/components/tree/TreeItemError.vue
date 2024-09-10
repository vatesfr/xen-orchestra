<!-- v1.1 -->
<template>
  <li class="tree-item-error typo h6-semi-bold">
    <slot />
  </li>
</template>

<style lang="postcss" scoped>
.tree-item-error {
  padding-left: 3rem;
  color: var(--color-danger-txt-base);
}
</style>
