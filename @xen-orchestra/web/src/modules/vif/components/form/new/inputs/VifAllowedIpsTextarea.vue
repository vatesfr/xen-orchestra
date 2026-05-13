<template>
  <UiTextarea v-model.trim="model" :accent="isValid ? 'brand' : 'danger'">
    {{ t('allowed-ips') }}

    <template #info>
      <!--      TODO change to have both when component will be updated -->
      <template v-if="isValid">{{ t('allowed-ips-exemple') }}</template>
      <template v-else>{{ t('invalid-ip-addresses') }}</template>
    </template>
  </UiTextarea>
</template>

<script lang="ts" setup>
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { useI18n } from 'vue-i18n'

const { isValid = true } = defineProps<{
  isValid?: boolean
}>()

const model = defineModel<string>({ required: true })

const { t } = useI18n()
</script>
