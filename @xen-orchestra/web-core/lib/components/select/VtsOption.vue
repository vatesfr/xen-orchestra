<template>
  <UiDropdown
    ref="elementRef"
    :checkbox="option.properties.multiple"
    :disabled="option.properties.disabled"
    :hover="option.flags.active"
    :selected="option.flags.selected"
    accent="normal"
  >
    <slot>{{ option.properties.label }}</slot>
  </UiDropdown>
</template>

<script generic="TOption extends FormOption" lang="ts" setup>
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import type { FormOption } from '@core/packages/form-select/types.ts'
import { useFormOptionController } from '@core/packages/form-select/use-form-option-controller.ts'

const { option } = defineProps<{
  option: TOption
}>()

const { elementRef } = useFormOptionController(() => option)
</script>
