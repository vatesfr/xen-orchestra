<template>
  <ul class="legend-list">
    <slot />
  </ul>
</template>

<script lang="ts" setup>
defineSlots<{
  default(): void
}>()
</script>

<style lang="postcss" scoped>
.legend-list {
  display: flex;
  flex-direction: column;
  padding-left: 1.6rem;
  gap: 0.4rem;
}
</style>
