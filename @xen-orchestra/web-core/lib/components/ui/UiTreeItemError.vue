<template>
  <li class="text-error">
    <slot />
  </li>
</template>

<style lang="postcss" scoped>
.text-error {
  padding-left: 3rem;
  font-weight: 700;
  font-size: 16px;
  line-height: 150%;
  color: var(--color-red-base);
}
</style>
