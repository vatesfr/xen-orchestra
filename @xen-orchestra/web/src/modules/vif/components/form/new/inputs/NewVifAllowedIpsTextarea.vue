<template>
  <UiTextarea v-model.trim="model" accent="brand">
    {{ t('allowed-ips') }}

    <template #info>
      {{ t('allowed-ips-exemple') }}
    </template>
  </UiTextarea>
</template>

<script lang="ts" setup>
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { useI18n } from 'vue-i18n'

const model = defineModel<string>({ required: true })

const { t } = useI18n()
</script>
