<template>
  <UiTableCell align="center">
    <UiButtonIcon :target-scale="1.5" accent="brand" size="small" :icon @click="handler" />
  </UiTableCell>
</template>

<script setup lang="ts">
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import type { IconName } from '@core/icons'

defineProps<{
  icon: IconName
  handler: () => void
}>()
</script>
