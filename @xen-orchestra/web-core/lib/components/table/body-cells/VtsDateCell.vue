<template>
  <UiTableCell>
    {{ d(date) }}
  </UiTableCell>
</template>

<script setup lang="ts">
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  date: string | number | Date
}>()

const { d } = useI18n()
</script>
