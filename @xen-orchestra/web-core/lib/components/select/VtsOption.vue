<template>
  <UiDropdown
    ref="elementRef"
    :accent
    :checkbox="isMultiple"
    :disabled="option.properties.disabled"
    :hover="option.flags.active"
    :selected="option.flags.selected"
  >
    <slot>{{ option.properties.label }}</slot>
  </UiDropdown>
</template>

<script generic="TOption extends FormOption<{ accent?: DropdownAccent }>" lang="ts" setup>
import UiDropdown, { type DropdownAccent } from '@core/components/ui/dropdown/UiDropdown.vue'
import { type FormOption, IK_FORM_SELECT_CONTROLLER, useFormOptionController } from '@core/packages/form-select'
import { computed, inject } from 'vue'

const { option } = defineProps<{
  option: TOption
}>()

const accent = computed(() => option.properties.accent ?? 'normal')

const { elementRef } = useFormOptionController(() => option)

const { isMultiple } = inject(IK_FORM_SELECT_CONTROLLER)!
</script>
