<template>
  <nav class="ui-menu-list">
    <slot />
  </nav>
</template>

<script lang="ts" setup>
defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.ui-menu-list {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 0.1rem solid var(--color-neutral-border);
  border-radius: 0.8rem;
}
</style>
