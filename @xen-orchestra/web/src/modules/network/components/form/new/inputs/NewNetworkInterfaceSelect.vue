<template>
  <VtsInputWrapper :label="t('interface')" :message="error">
    <VtsSelect :id accent="brand" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { FormSelectId } from '@core/packages/form-select'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useI18n } from 'vue-i18n'

const { id, error } = defineProps<{
  id: FormSelectId
  error?: InputWrapperMessage
}>()

const { t } = useI18n()
</script>
