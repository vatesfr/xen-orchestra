<template>
  <VtsInputWrapper :label="t('mac-address')" :message>
    <UiInput v-model.trim="model" accent="brand" :placeholder="t('auto-generated')" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { error } = defineProps<{
  error?: InputWrapperMessage
}>()

const model = defineModel<string>({ required: true })

const { t } = useI18n()

const message = computed<InputWrapperMessage>(() =>
  error === undefined
    ? {
        content: t('change-mac-restart-vif'),
        accent: 'info',
      }
    : (error as InputWrapperMessage)
)
</script>
