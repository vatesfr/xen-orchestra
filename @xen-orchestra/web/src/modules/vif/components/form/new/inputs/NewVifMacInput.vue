<template>
  <VtsInputWrapper :label="t('mac-address')" :message="error">
    <UiInput v-model.trim="model" accent="brand" :placeholder="t('auto-generated')" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  error?: InputWrapperMessage
}>()

const model = defineModel<string>({ required: true })

const { t } = useI18n()
</script>
