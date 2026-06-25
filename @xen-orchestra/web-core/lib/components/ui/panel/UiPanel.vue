<!-- v5 -->
<template>
  <div class="ui-panel" :class="{ error }">
    <div v-if="slots.header" class="header">
      <slot name="header" />
    </div>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  error?: boolean
}>()

const slots = defineSlots<{
  default(): any
  header?(): any
}>()
</script>

<style scoped lang="postcss">
.ui-panel {
  display: flex;
  flex-direction: column;
  border-inline-start: 0.1rem solid var(--color-neutral-border);
  border-block-end: 0.1rem solid var(--color-neutral-border);
  border-end-start-radius: 0.8rem;
  background-color: var(--color-neutral-background-secondary);

  .header {
    flex-shrink: 0;
    padding: 0.4rem 1.6rem;
    border-bottom: 0.1rem solid var(--color-neutral-border);
    background-color: var(--color-neutral-background-primary);
    display: flex;
    align-items: center;
    gap: 1.6rem;
  }

  .content {
    display: flex;
    flex-direction: column;
    padding: 0.8rem;
    gap: 0.8rem;
    scrollbar-width: thin;
  }

  &.error {
    background-color: var(--color-danger-background-selected);
  }
}
</style>
