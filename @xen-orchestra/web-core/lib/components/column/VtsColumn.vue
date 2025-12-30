<template>
  <div class="vts-column">
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.vts-column {
  flex: 1;
  flex-basis: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
