<template>
  <VtsInputWrapper :label :message="messages" wrap-message>
    <UiInput v-model.trim="model" accent="brand" :required :placeholder @blur="emit('blur')" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { computed } from 'vue'

const { info, error } = defineProps<{
  label: string
  info?: string
  error?: InputWrapperMessage
  required?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{ blur: [] }>()

const model = defineModel<string>({ required: true })

const messages = computed<InputWrapperMessage>(
  () => [info, error].filter(message => message !== undefined) as InputWrapperMessage
)
</script>
