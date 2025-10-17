<template>
  <UiTableCell>
    <VtsSelect :id accent="brand" />
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { useFormSelect } from '@core/packages/form-select'

const { options } = defineProps<{
  options: { id: string | number; label: string; value: any }[]
}>()

const model = defineModel<any>()

const { id } = useFormSelect(() => options, {
  model,
  option: {
    value: 'value',
  },
})
</script>
