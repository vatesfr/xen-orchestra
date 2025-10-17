<template>
  <UiTableCell>
    {{ text }}
  </UiTableCell>
</template>

<script setup lang="ts">
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'

defineProps<{
  text: string | number
}>()
</script>
