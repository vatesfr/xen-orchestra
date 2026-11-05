<template>
  <UiTableCell align="center" class="vts-flag-cell">
    <VtsIcon v-if="flagged" name="fa:circle" size="current" class="dot" />
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'

defineProps<{
  flagged: boolean
}>()
</script>

<style lang="postcss" scoped>
.vts-flag-cell {
  width: 4rem;

  .dot {
    font-size: 0.8rem;
    color: var(--color-info-txt-base);
  }
}
</style>
