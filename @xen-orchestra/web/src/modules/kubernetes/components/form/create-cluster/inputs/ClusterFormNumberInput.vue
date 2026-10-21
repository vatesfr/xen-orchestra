<template>
  <VtsInputWrapper :label :message="messages">
    <UiInput
      v-model.number="model"
      accent="brand"
      type="number"
      :required
      :disabled
      :suffix
      :min
      @blur="emit('blur')"
    />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import { mergeInputMessages } from '@/modules/kubernetes/utils/kubernetes-form-input.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { computed } from 'vue'

const { info, warning, error, suffix } = defineProps<{
  label: string
  suffix?: string
  error?: InputWrapperMessage
  warning?: InputWrapperMessage
  info?: string
  required?: boolean
  disabled?: boolean
  min?: number
}>()

const emit = defineEmits<{ blur: [] }>()

const model = defineModel<number>({ required: true })

const messages = computed(() => mergeInputMessages(info, warning, error))
</script>
