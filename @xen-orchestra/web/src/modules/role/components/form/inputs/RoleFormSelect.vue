<template>
  <VtsInputWrapper :label :message="messages" wrap-message>
    <VtsSelect :id accent="brand" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { FormSelectId } from '@core/packages/form-select'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { computed } from 'vue'

const { info, warning, error } = defineProps<{
  id: FormSelectId
  label: string
  info?: string
  warning?: InputWrapperMessage
  error?: InputWrapperMessage
}>()

const messages = computed<InputWrapperMessage>(
  () => [info, warning, error].filter(message => message !== undefined) as InputWrapperMessage
)
</script>
