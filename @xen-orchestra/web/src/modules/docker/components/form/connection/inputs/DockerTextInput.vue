<template>
  <VtsInputWrapper :label :message wrap-message>
    <UiInput
      v-model="value"
      :accent="error !== undefined ? 'danger' : 'brand'"
      :required
      :type
      :placeholder
      :name
      :autocomplete="type === 'password' ? 'new-password' : 'off'"
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

const { error, info, type } = defineProps<{
  label: string
  /** distinct from the login form's fields, so that the browser does not autofill them */
  name?: string
  error?: InputWrapperMessage
  info?: string
  required?: boolean
  type?: InputType
  placeholder?: string
  onBlur?: () => void
}>()

const model = defineModel<string>({ required: true })

// a password, e.g. an SSH passphrase, may start or end with a space
const value = computed({
  get: () => model.value,
  set: newValue => {
    model.value = type === 'password' ? newValue : newValue.trim()
  },
})

const message = computed<InputWrapperMessage | undefined>(() => {
  const messages = [...toArray(error), ...toArray(info)]

  return messages.length === 0 ? undefined : messages
})
</script>
