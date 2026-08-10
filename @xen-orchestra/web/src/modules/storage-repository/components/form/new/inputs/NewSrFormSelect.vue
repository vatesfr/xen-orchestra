<template>
  <VtsInputWrapper :label :message="messages" :wrap-message="wrapMessage">
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
import { computed } from 'vue'

export type NewSrFormSelectOption = FormOption<{
  icon?: IconName
  group?: 'vdi' | 'iso'
  isFirstInGroup?: boolean
}>

const {
  info,
  warning,
  error,
  wrapMessage = false,
} = defineProps<{
  id: FormSelectId
  label: string
  info?: string
  warning?: InputWrapperMessage
  error?: InputWrapperMessage
  wrapMessage?: boolean
}>()

const slots = defineSlots<{
  option?(props: { option: NewSrFormSelectOption }): any
}>()

const messages = computed<InputWrapperMessage>(
  () => [info, warning, error].filter(message => message !== undefined) as InputWrapperMessage
)
</script>
