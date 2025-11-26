<template>
  <UiTableCell align="end">
    <slot />
    <span v-if="unit" class="unit">{{ unit }}</span>
  </UiTableCell>
</template>

<script setup lang="ts">
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'

defineProps<{
  unit?: string
}>()
</script>

<style lang="postcss" scoped>
.unit {
  color: var(--color-neutral-txt-secondary);
  margin-inline-start: 0.4rem;
}
</style>
