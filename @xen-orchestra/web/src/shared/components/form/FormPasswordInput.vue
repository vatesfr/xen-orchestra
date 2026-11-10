<template>
  <VtsInputWrapper :label :message="error" wrap-message>
    <UiInput ref="input" v-model="model" accent="brand" type="password" :required @blur="emit('blur')" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useTemplateRef } from 'vue'

defineProps<{
  label: string
  error?: InputWrapperMessage
  required?: boolean
}>()

const emit = defineEmits<{ blur: [] }>()

const model = defineModel<string>({ required: true })

const input = useTemplateRef('input')

defineExpose({ focus: () => input.value?.focus() })
</script>
