<template>
  <VtsInputWrapper :label :message="messages">
    <UiInput v-model.number="model" accent="brand" type="number" :required @blur="emit('blur')">
      <template v-if="unit" #right-icon>
        <span class="unit typo-body-regular">{{ unit }}</span>
      </template>
    </UiInput>
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { computed } from 'vue'

const { info, warning, error } = defineProps<{
  label: string
  error?: InputWrapperMessage
  warning?: InputWrapperMessage
  info?: string
  required?: boolean
  unit?: string
}>()

const emit = defineEmits<{ blur: [] }>()
const model = defineModel<number | undefined>()

const messages = computed<InputWrapperMessage>(
  () => [info, warning, error].filter(message => message !== undefined) as InputWrapperMessage
)
</script>

<style lang="postcss" scoped>
.unit {
  color: var(--color-neutral-txt-secondary);
  pointer-events: none;
}
</style>
