<template>
  <VtsInputWrapper :label :message="messages" wrap-message>
    <VtsSelect :id accent="brand" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { FormSelectId } from '@core/packages/form-select'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { mergeInputWrapperMessages } from '@core/utils/input-wrapper-message.util.ts'
import { computed } from 'vue'

const { info, error } = defineProps<{
  id: FormSelectId
  label: string
  error?: InputWrapperMessage
  info?: string
}>()

const messages = computed(() => mergeInputWrapperMessages(info, error))
</script>
