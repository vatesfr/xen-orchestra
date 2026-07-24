<template>
  <UiCheckbox v-model="model" accent="brand">
    {{ t('network-block-device') }}
  </UiCheckbox>
</template>

<script lang="ts" setup>
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import { useI18n } from 'vue-i18n'

const model = defineModel<boolean>({ required: true })

const { t } = useI18n()
</script>
