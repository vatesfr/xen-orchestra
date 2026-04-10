<template>
  <UiRadioButtonGroup accent="brand" :gap="uiStore.isSmall ? 'narrow' : 'wide'">
    <UiRadioButton v-model="model" accent="brand" value="disabled">{{ t('disabled') }}</UiRadioButton>
    <UiRadioButton v-model="model" accent="brand" value="gzip">
      {{ t('duplicate-vm:compression-gzip') }}
    </UiRadioButton>
    <UiRadioButton v-model="model" accent="brand" value="zstd">
      {{ t('duplicate-vm:compression-zstd') }}
    </UiRadioButton>
  </UiRadioButtonGroup>
</template>

<script setup lang="ts">
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const model = defineModel<'disabled' | 'gzip' | 'zstd'>({ required: true })

const { t } = useI18n()

const uiStore = useUiStore()
</script>
