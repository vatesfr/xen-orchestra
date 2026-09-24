<template>
  <VtsInputWrapper :label :message="error">
    <UiInput
      v-model.number="model"
      :accent="error !== undefined ? 'danger' : 'brand'"
      type="number"
      :required
      @blur="onBlur?.()"
    />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'

defineProps<{
  label: string
  error?: InputWrapperMessage
  required?: boolean
  onBlur?: () => void
}>()

const model = defineModel<number | undefined>({ required: true })
</script>
