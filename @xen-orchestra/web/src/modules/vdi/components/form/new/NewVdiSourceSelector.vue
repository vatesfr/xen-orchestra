<template>
  <UiRadioButtonGroup accent="brand" gap="wide" :label="t('source')">
    <UiRadioButton v-model="model" :value="EMPTY" accent="brand">{{ t('source:empty') }}</UiRadioButton>
    <UiRadioButton v-model="model" :value="FILE" accent="brand">{{ t('source:file') }}</UiRadioButton>
    <UiRadioButton v-model="model" :value="URL_" accent="brand">{{ t('source:url') }}</UiRadioButton>
  </UiRadioButtonGroup>
</template>

<script lang="ts" setup>
import type { VdiSource } from '@/modules/vdi/jobs/xo-vdi-create.job.ts'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import { useI18n } from 'vue-i18n'

const model = defineModel<VdiSource>({ required: true })

const { t } = useI18n()

const EMPTY: VdiSource = 'empty'
const FILE: VdiSource = 'file'
const URL_: VdiSource = 'url'
</script>
