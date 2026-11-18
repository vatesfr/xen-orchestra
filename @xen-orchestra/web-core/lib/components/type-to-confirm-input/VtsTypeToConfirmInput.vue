<template>
  <div class="vts-type-to-confirm-input">
    <VtsRequiredHint />
    <VtsInputWrapper :label="t('type-x-to-confirm', { text: confirmationText })" :message="errorMessage">
      <UiInput ref="input" v-model="typedText" accent="brand" required />
    </VtsInputWrapper>
  </div>
</template>

<script lang="ts" setup>
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { confirmationText } = defineProps<{
  confirmationText: string
}>()

const { t } = useI18n()

const input = useTemplateRef('input')

const typedText = ref('')

const isErrorVisible = ref(false)

const errorMessage = computed<InputWrapperMessage | undefined>(() =>
  isErrorVisible.value
    ? { content: t('form:error:must-match', { text: confirmationText }), accent: 'danger' }
    : undefined
)

watch(typedText, () => {
  isErrorVisible.value = false
})

function validate() {
  const isMatching = typedText.value === confirmationText

  isErrorVisible.value = !isMatching

  if (!isMatching) {
    input.value?.focus()
  }

  return isMatching
}

defineExpose({ validate })
</script>

<style lang="postcss" scoped>
.vts-type-to-confirm-input {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
