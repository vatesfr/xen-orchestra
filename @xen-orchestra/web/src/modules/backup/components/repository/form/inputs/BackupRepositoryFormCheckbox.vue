<template>
  <div class="backup-repository-form-checkbox">
    <UiCheckbox v-model="model" accent="brand" :disabled>
      {{ label }}
    </UiCheckbox>
    <UiInfo v-if="warningMessage !== undefined" accent="warning" wrap>
      {{ warningMessage }}
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@xen-orchestra/web-core/components/input-wrapper/VtsInputWrapper.vue'
import UiCheckbox from '@xen-orchestra/web-core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@xen-orchestra/web-core/components/ui/info/UiInfo.vue'
import { computed } from 'vue'

const { warning } = defineProps<{
  label: string
  warning?: InputWrapperMessage
  disabled?: boolean
}>()

const model = defineModel<boolean>({ required: true })

const warningMessage = computed(() => {
  const firstWarning = Array.isArray(warning) ? warning[0] : warning
  return typeof firstWarning === 'object' ? firstWarning.content : firstWarning
})
</script>

<style lang="postcss" scoped>
.backup-repository-form-checkbox {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
