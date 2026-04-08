<template>
  <VtsInputWrapper :label="t('storage-repository')" :message="error">
    <VtsSelect :id :accent="error ? 'danger' : 'brand'" />
  </VtsInputWrapper>
</template>

<script setup lang="ts">
import type { FormSelectId } from '@core/packages/form-select'
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  id: FormSelectId
  error?: InputWrapperMessage
}>()

const { t } = useI18n()
</script>
