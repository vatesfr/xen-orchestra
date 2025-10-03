<template>
  <UiTableCell>
    <UiInput v-model="model" :type :placeholder accent="brand" :disabled />
  </UiTableCell>
</template>

<script setup lang="ts">
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'

export type InputCellProps = {
  placeholder?: string
  disabled?: boolean
  type?: 'text' | 'number'
}

defineProps<InputCellProps>()

const model = defineModel<string | number>({ default: '' })
</script>
