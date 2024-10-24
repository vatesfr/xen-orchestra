<template>
  <div class="vts-divider" :class="type" />
</template>

<script setup lang="ts">
defineProps<{
  type: 'stretch' | 'tab'
}>()
</script>

<style scoped lang="postcss">
.vts-divider {
  border-left: 0.1rem solid var(--color-neutral-border);
  border-bottom: 0.1rem solid var(--color-neutral-border);

  &.tab {
    height: 2.4rem;
    align-self: center;
  }

  &.stretch {
    align-self: stretch;
  }
}
</style>
