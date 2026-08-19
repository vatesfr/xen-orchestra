<template>
  <UiTextarea v-model.trim="model" :accent="errorMessage !== undefined ? 'danger' : 'brand'" :required>
    {{ label }}

    <template v-if="info !== undefined" #info>{{ info }}</template>
    <template v-if="errorMessage !== undefined" #message>{{ errorMessage }}</template>
  </UiTextarea>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { computed } from 'vue'

const { error } = defineProps<{
  label: string
  info?: string
  error?: InputWrapperMessage
  required?: boolean
}>()

const model = defineModel<string>({ required: true })

const errorMessage = computed(() => {
  const first = Array.isArray(error) ? error[0] : error

  return typeof first === 'object' ? first.content : first
})
</script>
