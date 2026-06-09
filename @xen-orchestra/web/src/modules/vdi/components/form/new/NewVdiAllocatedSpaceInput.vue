<template>
  <VtsInputWrapper :label :message="error">
    <UiInput v-model.number="model" accent="brand" type="number" :required>
      <template #right-icon>
        <span class="unit typo-body-regular">{{ t('bytes:gi') }}</span>
      </template>
    </UiInput>
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  label: string
  error?: InputWrapperMessage
  required?: boolean
}>()

const model = defineModel<number | undefined>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.unit {
  color: var(--color-neutral-txt-secondary);
}
</style>
