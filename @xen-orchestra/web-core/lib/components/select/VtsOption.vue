<template>
  <UiDropdown
    ref="elementRef"
    :checkbox="option.properties.multiple"
    :disabled="option.properties.disabled"
    :hover="option.flags.active"
    :selected="option.flags.selected"
    accent="normal"
  >
    {{ option.properties.label }}
  </UiDropdown>
</template>

<script generic="TOption extends FormOption<unknown, PropertyKey>" lang="ts" setup>
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import type { FormOption } from '@core/packages/form-select/type.ts'
import { useFormOption } from '@core/packages/form-select/use-form-option.ts'

const { option } = defineProps<{
  option: TOption
}>()

const { elementRef } = useFormOption(() => option)
</script>
