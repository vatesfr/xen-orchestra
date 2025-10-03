<template>
  <UiTableCell align="right">
    {{ value }}
    <span v-if="unit" class="unit">{{ unit }}</span>
  </UiTableCell>
</template>

<script setup lang="ts">
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'

const { value } = defineProps<{
  value: number | string
  unit?: string
}>()
</script>

<style lang="postcss" scoped>
.unit {
  color: var(--color-neutral-txt-secondary);
}
</style>
