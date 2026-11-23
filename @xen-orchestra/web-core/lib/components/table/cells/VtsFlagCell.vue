<template>
  <UiTableCell align="center" class="vts-flag-cell">
    <UiOverridden v-if="flagged" />
  </UiTableCell>
</template>

<script setup lang="ts">
import UiOverridden from '@core/components/ui/overridden/UiOverridden.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'

defineProps<{
  flagged: boolean
}>()
</script>

<style lang="postcss" scoped>
.vts-flag-cell {
  width: 4rem;
}
</style>
