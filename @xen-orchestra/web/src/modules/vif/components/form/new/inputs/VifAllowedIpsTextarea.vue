<template>
  <UiTextarea v-model.trim="model" :accent="errorMessage !== undefined ? 'danger' : 'brand'">
    {{ t('allowed-ips') }}

    <template #info>
      <!--      TODO change to have both when component will be updated -->
      <template v-if="errorMessage === undefined">{{ t('allowed-ips-example') }}</template>
      <template v-else>{{ errorMessage }}</template>
    </template>
  </UiTextarea>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { error } = defineProps<{
  error?: InputWrapperMessage
}>()

const model = defineModel<string>({ required: true })

const { t } = useI18n()

const errorMessage = computed(() => {
  const first = Array.isArray(error) ? error[0] : error
  return typeof first === 'object' ? first.content : first
})
</script>
