<template>
  <UiButton
    :busy="isScanningPifs"
    :disabled="!host"
    left-icon="action:scan"
    variant="secondary"
    accent="brand"
    size="medium"
    @click="scanPifs()"
  >
    {{ t('scan-pifs') }}
  </UiButton>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { usePifScanJob } from '@/modules/pif/jobs/pif-scan.job.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{ host: XenApiHost | undefined }>()

const { t } = useI18n()

const { run: scanPifs, isRunning: isScanningPifs } = usePifScanJob(() => host)
</script>
