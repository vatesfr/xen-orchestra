<template>
  <VtsInputWrapper :label :message="messages" wrap-message>
    <UiInput v-model.trim="model" accent="brand" :required :disabled :right-icon @blur="emit('blur')" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import { mergeInputMessages } from '@/modules/kubernetes/utils/kubernetes-form-input.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { IconName } from '@core/icons'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { computed } from 'vue'

const { info, warning, error } = defineProps<{
  label: string
  info?: string
  warning?: InputWrapperMessage
  error?: InputWrapperMessage
  required?: boolean
  disabled?: boolean
  rightIcon?: IconName
}>()

const emit = defineEmits<{ blur: [] }>()

const model = defineModel<string>({ required: true })

const messages = computed(() => mergeInputMessages(info, warning, error))
</script>
