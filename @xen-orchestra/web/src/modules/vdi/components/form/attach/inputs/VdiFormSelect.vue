<template>
  <VtsInputWrapper :label :message="messages" wrap>
    <VtsSelect :id accent="brand">
      <template v-if="slots.option" #default="slotProps">
        <slot name="option" v-bind="slotProps" />
      </template>
    </VtsSelect>
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { IconName } from '@core/icons'
import type { FormOption, FormSelectId } from '@core/packages/form-select'
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { computed } from 'vue'

export type VdiFormSelectOption = FormOption<{ icon?: IconName }>

const { error, warning } = defineProps<{
  id: FormSelectId
  label: string
  error?: InputWrapperMessage
  warning?: InputWrapperMessage
}>()

const slots = defineSlots<{
  option?(props: { option: VdiFormSelectOption }): any
}>()

const messages = computed(() => [error, warning].filter(message => message !== undefined).flat())
</script>
