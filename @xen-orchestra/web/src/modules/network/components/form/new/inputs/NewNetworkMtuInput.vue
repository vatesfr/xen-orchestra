<template>
  <VtsInputWrapper :label="t('mtu')" :message="messages">
    <UiInput v-model.number="model" accent="brand" type="number" @blur="emit('blur')" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { error, warning } = defineProps<{
  error?: InputWrapperMessage
  warning?: InputWrapperMessage
}>()

const emit = defineEmits<{ blur: [] }>()

const model = defineModel<number | undefined>()

const { t } = useI18n()

const messages = computed<InputWrapperMessage>(
  () => [t('mtu-default-value-message'), warning, error].filter(message => message !== undefined) as InputWrapperMessage
)
</script>
