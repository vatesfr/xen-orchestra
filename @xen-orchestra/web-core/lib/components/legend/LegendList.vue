<template>
  <ul class="legend-list" :class="{ horizontal }">
    <slot />
  </ul>
</template>

<script lang="ts" setup>
defineProps<{
  horizontal?: boolean
}>()

defineSlots<{
  default(): void
}>()
</script>

<style lang="postcss" scoped>
.legend-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  &.horizontal {
    flex-direction: row;
    gap: 4rem;
  }
}
</style>
