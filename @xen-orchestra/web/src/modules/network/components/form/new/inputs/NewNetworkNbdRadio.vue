<template>
  <UiRadioButtonGroup
    :label="t('network-block-device')"
    :accent="model === 'insecure-nbd' ? 'warning' : 'brand'"
    :gap="uiStore.isSmall ? 'narrow' : 'wide'"
  >
    <UiRadioButton v-for="option of options" :key="option.value" v-model="model" accent="brand" :value="option.value">
      {{ option.label }}
    </UiRadioButton>
    <template v-if="model === 'insecure-nbd'" #info>
      {{ t('nbd:insecure-warning') }}
    </template>
  </UiRadioButtonGroup>
</template>

<script lang="ts" setup>
import type { NetworkNbdMode } from '@/modules/network/form/use-network-form-base.ts'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const model = defineModel<NetworkNbdMode>({ required: true })

const { t } = useI18n()

const uiStore = useUiStore()

const options = computed<{ label: string; value: NetworkNbdMode }[]>(() => [
  { label: t('nbd:disabled'), value: 'none' },
  { label: t('nbd:secure'), value: 'nbd' },
  { label: t('nbd:insecure'), value: 'insecure-nbd' },
])
</script>
