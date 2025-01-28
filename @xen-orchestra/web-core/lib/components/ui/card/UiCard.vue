<template>
  <div class="ui-card" :class="{ horizontal }">
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  horizontal?: boolean
}>()

defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.ui-card {
  display: flex;
  gap: 2.4rem;
  padding: 2.4rem;
  flex-direction: column;
  background-color: var(--color-neutral-background-primary);
  border: 0.1rem solid var(--color-neutral-border);
  border-radius: 0.8rem;

  &.horizontal {
    flex-direction: row;
  }
}
</style>
