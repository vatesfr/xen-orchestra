<template>
  <VtsInputWrapper :label :message="messages" wrap-message>
    <UiInput v-model.trim="model" accent="brand" :required @blur="emit('blur')" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@xen-orchestra/web-core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@xen-orchestra/web-core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@xen-orchestra/web-core/components/ui/input/UiInput.vue'
import { computed } from 'vue'

const { info, warning, error } = defineProps<{
  label: string
  info?: string
  warning?: InputWrapperMessage
  error?: InputWrapperMessage
  required?: boolean
}>()

const emit = defineEmits<{ blur: [] }>()

const model = defineModel<string>({ required: true })

const messages = computed<InputWrapperMessage>(
  () => [info, warning, error].filter(message => message !== undefined) as InputWrapperMessage
)
</script>
