<template>
  <div class="vts-backdrop">
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineSlots<{
  default?(): any
}>()
</script>

<style lang="postcss" scoped>
.vts-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1010;
}
</style>
