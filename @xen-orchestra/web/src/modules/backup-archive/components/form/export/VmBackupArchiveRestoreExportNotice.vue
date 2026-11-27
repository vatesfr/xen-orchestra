<template>
  <UiAlert accent="info">
    <I18nT v-if="isDownload" :keypath="downloadKeypath" scope="global">
      <template #proxy>
        <strong>{{ proxyName ?? t('xen-orchestra') }}</strong>
      </template>
    </I18nT>
    <template v-else>{{ t('export-runs-as-a-task-notice') }}</template>
  </UiAlert>
</template>

<script lang="ts" setup>
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { I18nT, useI18n } from 'vue-i18n'

defineProps<{
  isDownload: boolean
  downloadKeypath: string
  proxyName?: string
}>()

const { t } = useI18n()
</script>
