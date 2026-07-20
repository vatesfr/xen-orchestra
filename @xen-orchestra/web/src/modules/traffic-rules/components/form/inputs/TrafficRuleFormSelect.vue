<template>
  <VtsInputWrapper :label :message="messages">
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
import type { InputWrapperMessage } from '@xen-orchestra/web-core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@xen-orchestra/web-core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@xen-orchestra/web-core/components/select/VtsSelect.vue'
import type { Status } from '@xen-orchestra/web-core/components/status/VtsStatus.vue'
import { computed } from 'vue'

export type TrafficRuleFormSelectOption = FormOption<{
  icon?: IconName
  status?: Status
}>

const { info, warning, error } = defineProps<{
  id: FormSelectId
  label: string
  info?: string
  warning?: InputWrapperMessage
  error?: InputWrapperMessage
}>()

const slots = defineSlots<{
  option?(props: { option: TrafficRuleFormSelectOption }): any
}>()

const messages = computed<InputWrapperMessage>(
  () => [info, warning, error].filter(message => message !== undefined) as InputWrapperMessage
)
</script>
