<template>
  <VtsInputWrapper :label="t('mac-address')" :message="messages" wrap-message>
    <UiInput v-model.trim="model" accent="brand" :required :placeholder="required ? undefined : t('auto-generated')" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { info, error } = defineProps<{
  error?: InputWrapperMessage
  info?: string
  required?: boolean
}>()

const model = defineModel<string>({ required: true })

const { t } = useI18n()

const messages = computed<InputWrapperMessage>(
  () => [info, error].filter(message => message !== undefined) as InputWrapperMessage
)
</script>
