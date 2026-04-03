<template>
  <VtsInputWrapper :label="t('mac-address')">
    <UiInput v-model.trim="model" accent="brand" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useI18n } from 'vue-i18n'

const model = defineModel<string>({ required: true })

const { t } = useI18n()
</script>
