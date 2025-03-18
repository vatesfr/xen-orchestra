<template>
  <UiDropdown ref="elementRef" :checkbox :disabled :hover="isActive" :selected="isSelected" accent="normal">
    <slot />
  </UiDropdown>
</template>

<script lang="ts" setup>
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import type { FormOptionValue } from '@core/packages/form-select/form-select.type.ts'
import { useFormOption } from '@core/packages/form-select/use-form-option'

const { value, disabled } = defineProps<{
  value: FormOptionValue
  checkbox?: boolean
  disabled?: boolean
}>()

const { elementRef, isActive, isSelected } = useFormOption(() => value, { disabled: () => disabled })
</script>
