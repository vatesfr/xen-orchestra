<template>
  <VtsInputWrapper :label :message="messages">
    <UiInput v-model.trim="model" accent="brand" type="text" :required @blur="emit('blur')" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { computed } from 'vue'

const { warning, error } = defineProps<{
  label: string
  error?: InputWrapperMessage
  warning?: InputWrapperMessage
  required?: boolean
}>()

const emit = defineEmits<{ blur: [] }>()
const model = defineModel<string>({ required: true })

const messages = computed<InputWrapperMessage>(
  () => [warning, error].filter(message => message !== undefined) as InputWrapperMessage
)
</script>
