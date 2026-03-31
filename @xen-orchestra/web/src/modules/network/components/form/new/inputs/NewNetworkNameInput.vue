<template>
  <VtsInputWrapper :label="t('name')" :message="error">
    <UiInput v-model.trim="model" accent="brand" required />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  error?: InputWrapperMessage
}>()

const model = defineModel<string>({ required: true })

const { t } = useI18n()
</script>
