<template>
  <tr class="vts-row" :class="{ selected, error }">
    <slot />
  </tr>
</template>

<script lang="ts" setup>
defineProps<{
  selected?: boolean
  error?: boolean
}>()
</script>

<style lang="postcss" scoped>
.vts-row {
  &.selected {
    --ui-table-cell-background-color: var(--color-brand-background-selected);
  }

  &.error {
    --ui-table-cell-background-color: var(--color-danger-background-selected);
  }

  &:not(:last-child) {
    :deep(th),
    :deep(td) {
      border-bottom: none;
    }
  }
}
</style>
