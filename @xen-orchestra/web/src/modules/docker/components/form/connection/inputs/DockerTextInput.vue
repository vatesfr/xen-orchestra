<template>
  <VtsInputWrapper :label :message>
    <UiInput
      v-model.trim="model"
      :accent="error !== undefined ? 'danger' : 'brand'"
      :required
      :type
      :placeholder
      autocomplete="off"
      spellcheck="false"
      autocapitalize="off"
      @blur="onBlur?.()"
    />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput, { type InputType } from '@core/components/ui/input/UiInput.vue'
import { toArray } from '@core/utils/to-array.utils.ts'
import { computed } from 'vue'

const { error, info } = defineProps<{
  label: string
  error?: InputWrapperMessage
  info?: string
  required?: boolean
  type?: InputType
  placeholder?: string
  onBlur?: () => void
}>()

const model = defineModel<string>({ required: true })

const message = computed<InputWrapperMessage | undefined>(() => {
  const messages = [...(error === undefined ? [] : toArray(error)), ...(info === undefined ? [] : [info])]

  return messages.length === 0 ? undefined : messages
})
</script>
