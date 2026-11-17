<template>
  <div class="vts-card-row-list">
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.vts-card-row-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
