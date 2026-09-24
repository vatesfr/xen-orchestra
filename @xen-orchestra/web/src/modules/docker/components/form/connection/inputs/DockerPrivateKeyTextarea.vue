<template>
  <UiTextarea
    v-model="model"
    class="docker-private-key-textarea"
    :accent="errorMessage !== undefined ? 'danger' : 'brand'"
    :required
    autocomplete="off"
    spellcheck="false"
    autocapitalize="off"
    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
    @blur="onBlur?.()"
  >
    {{ label }}
    <template #info>{{ t('docker-ssh-private-key-info') }}</template>
    <template v-if="errorMessage !== undefined" #message>{{ errorMessage }}</template>
  </UiTextarea>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { error } = defineProps<{
  label: string
  error?: InputWrapperMessage
  required?: boolean
  onBlur?: () => void
}>()

const model = defineModel<string>({ required: true })

const { t } = useI18n()

const errorMessage = computed(() => {
  const first = Array.isArray(error) ? error[0] : error
  return typeof first === 'object' ? first.content : first
})
</script>

<style lang="postcss" scoped>
.docker-private-key-textarea :deep(.textarea) {
  font-family: monospace;
  min-height: 12rem;
}
</style>
