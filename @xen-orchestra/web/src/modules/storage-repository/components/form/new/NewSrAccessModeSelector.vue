<template>
  <UiRadioButtonGroup accent="brand" gap="wide" :label>
    <UiRadioButton v-model="model" :value="SR_ACCESS_MODE.SHARED" accent="brand">
      {{ t('shared') }}
    </UiRadioButton>
    <UiRadioButton v-model="model" :value="SR_ACCESS_MODE.LOCAL" accent="brand">
      {{ t('local') }}
    </UiRadioButton>
  </UiRadioButtonGroup>
</template>

<script lang="ts" setup>
import type { NewSrAccessMode } from '@/modules/storage-repository/types/xo-sr-create.type.ts'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import { SR_ACCESS_MODE } from '@core/types/storage-repository.type.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  label?: string
}>()

const model = defineModel<NewSrAccessMode>({ required: true })

const { t } = useI18n()
</script>
