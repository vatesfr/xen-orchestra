<template>
  <div class="vts-task-item-label" :class="{ selected }">
    <VtsTreeItemToggle size="small" @toggle="emit('toggle')" />
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsTreeItemToggle from '@core/components/tree/VtsTreeItemToggle.vue'

const { selected } = defineProps<{
  selected?: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.vts-task-item-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background-color: var(--color-neutral-background-primary);

  &.selected {
    background-color: var(--color-brand-background-selected);
  }

  .content {
    display: flex;
    flex: 1;
    min-width: 0;
    align-self: stretch;
    border-block-end: 0.1rem solid var(--color-neutral-border);
  }
}
</style>
