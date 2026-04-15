<template>
  <VtsInputWrapper :label :message="error" @focusout="onFocusOut">
    <VtsSelect :id accent="brand" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { FormSelectId } from '@core/packages/form-select'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'

defineProps<{
  id: FormSelectId
  label: string
  error?: InputWrapperMessage
}>()

const emit = defineEmits<{ blur: [] }>()

function onFocusOut(event: FocusEvent) {
  const container = event.currentTarget as HTMLElement

  if (!container.contains(event.relatedTarget as Node | null)) {
    emit('blur')
  }
}
</script>
