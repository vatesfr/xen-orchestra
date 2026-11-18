<template>
  <VtsInputWrapper :label :message="messages" wrap-message>
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
import { mergeInputWrapperMessages } from '@core/utils/input-wrapper-message.util.ts'
import type { InputWrapperMessage } from '@xen-orchestra/web-core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@xen-orchestra/web-core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@xen-orchestra/web-core/components/select/VtsSelect.vue'
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

const messages = computed(() => mergeInputWrapperMessages(error, warning))
</script>
