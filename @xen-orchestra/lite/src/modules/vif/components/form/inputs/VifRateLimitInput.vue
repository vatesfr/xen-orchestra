<template>
  <VtsInputWrapper :label="t('rate-limit')" :message="error">
    <UiInput v-model.number="model" accent="brand" type="number">
      <template #right-icon>
        <span class="unit typo-body-regular">{{ t('bytes:kbs') }}</span>
      </template>
    </UiInput>
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  error?: InputWrapperMessage
}>()

const model = defineModel<number | undefined>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.unit {
  color: var(--color-neutral-txt-secondary);
  pointer-events: none;
}
</style>
