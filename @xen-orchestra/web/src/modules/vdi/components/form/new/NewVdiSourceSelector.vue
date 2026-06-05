<template>
  <UiRadioButtonGroup accent="brand" gap="wide" :label="t('source')">
    <UiRadioButton v-model="model" :value="VDI_SOURCE.EMPTY" accent="brand">
      {{ t('empty') }}
    </UiRadioButton>
    <UiRadioButton v-model="model" v-tooltip="t('coming-soon!')" disabled value="file" accent="brand">
      {{ t('file') }}
    </UiRadioButton>
    <UiRadioButton v-model="model" v-tooltip="t('coming-soon!')" disabled value="url" accent="brand">
      {{ t('url') }}
    </UiRadioButton>
  </UiRadioButtonGroup>
</template>

<script lang="ts" setup>
import type { VdiSource } from '@/modules/vdi/jobs/xo-vdi-create.job.ts'
import { VDI_SOURCE } from '@/shared/constants.ts'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useI18n } from 'vue-i18n'

const model = defineModel<VdiSource>({ required: true })

const { t } = useI18n()
</script>
