<template>
  <div class="vts-type-to-confirm-input">
    <VtsRequiredHint />
    <VtsInputWrapper :label="t('type-x-to-confirm', { text: confirmationText })">
      <UiInput v-model="typedText" accent="brand" required />
    </VtsInputWrapper>
  </div>
</template>

<script lang="ts" setup>
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { confirmationText } = defineProps<{
  confirmationText: string
}>()

const isConfirmed = defineModel<boolean>({ required: true })

const { t } = useI18n()

const typedText = ref('')

watch(
  () => typedText.value === confirmationText,
  isMatching => {
    isConfirmed.value = isMatching
  }
)
</script>

<style lang="postcss" scoped>
.vts-type-to-confirm-input {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
