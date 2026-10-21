<template>
  <UiAlert accent="info" role="status">
    <I18nT keypath="v2v:existing-list-info" scope="global" tag="span">
      <template #migration>
        <strong>{{ t('source-to-destination', { source: sourceHost, destination: poolName }) }}</strong>
      </template>
      <template #vms>{{ t('n-vms', { n: vmCount }) }}</template>
    </I18nT>
  </UiAlert>
</template>

<script lang="ts" setup>
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { I18nT, useI18n } from 'vue-i18n'

defineProps<{
  sourceHost: string
  poolName: string
  vmCount: number
}>()

const { t } = useI18n()
</script>
