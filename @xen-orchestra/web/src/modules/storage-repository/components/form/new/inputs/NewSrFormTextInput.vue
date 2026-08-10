<template>
  <VtsInputWrapper :label :message="messages" wrap-message>
    <UiInput v-model.trim="model" accent="brand" :required :type @blur="emit('blur')" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput, { type InputType } from '@core/components/ui/input/UiInput.vue'
import { computed } from 'vue'

const {
  info,
  warning,
  error,
  type = 'text',
} = defineProps<{
  label: string
  info?: string
  warning?: InputWrapperMessage
  error?: InputWrapperMessage
  required?: boolean
  type?: InputType
}>()

const emit = defineEmits<{ blur: [] }>()

const model = defineModel<string>({ required: true })

const messages = computed<InputWrapperMessage>(
  () => [info, warning, error].filter(message => message !== undefined) as InputWrapperMessage
)
</script>
