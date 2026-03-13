<template>
  <div
    class="step"
    :class="{
      done: isCompleted,
      active: isActive,
    }"
  />
</template>

<script lang="ts" setup>
defineProps<{
  isActive: boolean
  isCompleted: boolean
}>()
</script>

<style lang="postcss" scoped>
.step {
  flex: 1;
  height: 0.8rem;
  border-radius: 9rem;
  background-color: var(--color-neutral-background-disabled);
  transition: background 0.3s;

  &.done,
  &.active {
    background-color: var(--color-brand-item-base);
  }
}
</style>
