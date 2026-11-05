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
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  min-width: 0;

  @container vts-columns (max-width: 90rem) {
    flex-basis: 100%;
  }
}
</style>
