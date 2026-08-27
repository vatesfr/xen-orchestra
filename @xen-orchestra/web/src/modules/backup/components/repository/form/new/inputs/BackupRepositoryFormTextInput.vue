<template>
  <VtsInputWrapper :label :message="messages">
    <UiInput v-model.trim="model" accent="brand" :type :required :placeholder :prefix />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { InputType } from '@core/components/ui/input/UiInput.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { computed } from 'vue'

const { info, error } = defineProps<{
  label: string
  info?: string
  error?: InputWrapperMessage
  required?: boolean
  placeholder?: string
  prefix?: string
  type?: InputType
}>()

const model = defineModel<string>({ required: true })

const messages = computed<InputWrapperMessage>(() => error ?? info ?? [])
</script>
