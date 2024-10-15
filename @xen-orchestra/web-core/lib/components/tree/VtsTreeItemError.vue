<template>
  <li class="vts-tree-item-error typo h6-semi-bold">
    <slot />
  </li>
</template>

<script lang="ts" setup>
defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.vts-tree-item-error {
  padding-left: 3rem;
  color: var(--color-danger-txt-base);
}
</style>
