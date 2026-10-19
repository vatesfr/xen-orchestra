<template>
  <VtsInputWrapper :label :message="messages" wrap-message>
    <VtsSelect :id accent="brand">
      <template v-if="slots.option" #default="slotProps">
        <slot name="option" v-bind="slotProps" />
      </template>
    </VtsSelect>
  </VtsInputWrapper>
</template>

<script generic="TSelectId extends FormSelectId" lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { FormSelectId, FormSelectIdToOption } from '@core/packages/form-select'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { computed } from 'vue'

const { error, warning } = defineProps<{
  id: TSelectId
  label: string
  error?: InputWrapperMessage
  warning?: InputWrapperMessage
}>()

const slots = defineSlots<{
  option?(props: { option: FormSelectIdToOption<TSelectId> }): any
}>()

const messages = computed(() => [error, warning].filter(message => message !== undefined).flat())
</script>
