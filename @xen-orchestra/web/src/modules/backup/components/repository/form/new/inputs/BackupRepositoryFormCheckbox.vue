<template>
  <div class="backup-repository-form-checkbox">
    <UiCheckbox v-model="model" accent="brand">
      {{ label }}
    </UiCheckbox>
    <UiInfo v-if="warningMessage !== undefined" accent="warning" wrap>
      {{ warningMessage }}
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { computed } from 'vue'

const { warning } = defineProps<{
  label: string
  warning?: InputWrapperMessage
}>()

const model = defineModel<boolean>({ required: true })

const warningMessage = computed(() => {
  const first = Array.isArray(warning) ? warning[0] : warning
  return typeof first === 'object' ? first.content : first
})
</script>

<style lang="postcss" scoped>
.backup-repository-form-checkbox {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
