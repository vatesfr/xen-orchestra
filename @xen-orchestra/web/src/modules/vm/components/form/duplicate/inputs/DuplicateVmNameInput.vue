<template>
  <VtsInputWrapper :label="t('duplicate-vm:name')" :message="error">
    <UiInput v-model.trim="model" required :accent="error ? 'danger' : 'brand'" />
  </VtsInputWrapper>
</template>

<script setup lang="ts">
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  error?: InputWrapperMessage
}>()

const model = defineModel<string>({ required: true })

const { t } = useI18n()
</script>
