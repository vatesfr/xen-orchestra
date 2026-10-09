<template>
  <UiTextarea v-model.trim="model" :accent :disabled :required :max-characters @blur="emit('blur')">
    {{ label }}
    <template v-if="info" #info>{{ info }}</template>
    <template v-if="messageContent !== undefined" #message>{{ messageContent }}</template>
  </UiTextarea>
</template>

<script setup lang="ts">
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { toArray } from '@core/utils/to-array.utils.ts'
import { computed } from 'vue'

const { error, warning } = defineProps<{
  label: string
  info?: string
  warning?: InputWrapperMessage
  error?: InputWrapperMessage
  required?: boolean
  disabled?: boolean
  maxCharacters?: number
}>()

const emit = defineEmits<{ blur: [] }>()

const model = defineModel<string>({ required: true })

const messageContent = computed(() => {
  const [firstMessage] = toArray(error ?? warning ?? [])

  return typeof firstMessage === 'string' ? firstMessage : firstMessage?.content
})

const accent = computed((): 'brand' | 'warning' | 'danger' => {
  if (error !== undefined) {
    return 'danger'
  }

  if (warning !== undefined) {
    return 'warning'
  }

  return 'brand'
})
</script>
