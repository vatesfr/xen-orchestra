<template>
  <VtsInputWrapper :label :message="error" wrap-message>
    <VtsSelect :id accent="brand">
      <template v-if="slots.option" #default="slotProps">
        <slot name="option" v-bind="slotProps" />
      </template>
    </VtsSelect>
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { IconName } from '@core/icons'
import type { FormOption, FormSelectId } from '@core/packages/form-select'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'

export type DuplicateVmFormSelectOption = FormOption<{ icon?: IconName }>

defineProps<{
  id: FormSelectId
  label: string
  error?: InputWrapperMessage
}>()

const slots = defineSlots<{
  option?(props: { option: DuplicateVmFormSelectOption }): any
}>()
</script>
