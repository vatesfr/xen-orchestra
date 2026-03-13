<template>
  <VtsInputWrapper :label="t('vlan')" :message="error">
    <UiInput v-model.number="model" accent="brand" type="number" required @blur="emit('blur')" />
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

const emit = defineEmits<{ blur: [] }>()

const model = defineModel<number | undefined>()

const { t } = useI18n()
</script>
