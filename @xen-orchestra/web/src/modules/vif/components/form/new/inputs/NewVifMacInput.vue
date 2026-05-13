<template>
  <VtsInputWrapper :label="t('mac-address')" :message="errorMessage">
    <UiInput v-model.trim="model" accent="brand" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { isValid = true } = defineProps<{
  isValid?: boolean
}>()

const model = defineModel<string>({ required: true })

const { t } = useI18n()

const errorMessage = computed<InputWrapperMessage | undefined>(() =>
  isValid ? undefined : { content: t('invalid-mac-address'), accent: 'danger' }
)
</script>
