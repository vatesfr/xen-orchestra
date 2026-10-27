<template>
  <div class="backup-job-form-checkbox">
    <UiCheckbox v-model="model" accent="brand" :disabled>
      {{ label }}
    </UiCheckbox>
    <UiInfo v-if="info" accent="info" wrap>
      {{ info }}
    </UiInfo>
    <UiInfo v-for="message of errorMessages" :key="message" accent="danger" wrap>
      {{ message }}
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { toArray } from '@core/utils/to-array.utils.ts'
import { computed } from 'vue'

const { error } = defineProps<{
  label: string
  info?: string
  error?: InputWrapperMessage
  disabled?: boolean
}>()

const model = defineModel<boolean>({ required: true })

const errorMessages = computed(() =>
  toArray(error).map(message => (typeof message === 'object' ? message.content : message))
)
</script>

<style lang="postcss" scoped>
.backup-job-form-checkbox {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
