<template>
  <div class="backup-job-form-checkbox">
    <UiCheckbox v-model="model" accent="brand" :disabled>
      {{ label }}
    </UiCheckbox>
    <UiInfo v-if="info" accent="info" wrap>
      {{ info }}
    </UiInfo>
    <UiInfo v-if="errorMessage !== undefined" accent="danger" wrap>
      {{ errorMessage }}
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import { toErrorMessage } from '@/modules/backup-job/utils/backup-job-error-message.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { computed } from 'vue'

const { error } = defineProps<{
  label: string
  info?: string
  error?: InputWrapperMessage
  disabled?: boolean
}>()

const model = defineModel<boolean>({ required: true })

const errorMessage = computed(() => toErrorMessage(error))
</script>

<style lang="postcss" scoped>
.backup-job-form-checkbox {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
