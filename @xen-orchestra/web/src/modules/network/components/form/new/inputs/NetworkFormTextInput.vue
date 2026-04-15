<template>
  <VtsInputWrapper :label :message="error">
    <UiInput v-model.trim="model" accent="brand" :required @blur="emit('blur')" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'

defineProps<{
  label: string
  error?: InputWrapperMessage
  required?: boolean
}>()

const emit = defineEmits<{ blur: [] }>()

const model = defineModel<string>({ required: true })
</script>
