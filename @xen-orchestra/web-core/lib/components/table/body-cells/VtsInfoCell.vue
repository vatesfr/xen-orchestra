<template>
  <UiTableCell>
    <UiInfo :accent>{{ label }}</UiInfo>
  </UiTableCell>
</template>

<script setup lang="ts">
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'

defineProps<{
  label: string
  accent: InfoAccent
}>()
</script>
