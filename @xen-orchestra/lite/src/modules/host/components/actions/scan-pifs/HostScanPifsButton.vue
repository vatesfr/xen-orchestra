<template>
  <UiButton
    v-tooltip="!canScanPifs && scanPifsErrorMessage"
    :busy="isScanningPifs"
    :disabled="!canScanPifs"
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
import { useHostScanPifsJob } from '@/modules/host/jobs/host-scan-pifs.job.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{ host: XenApiHost | undefined }>()

const { t } = useI18n()

const {
  run: scanPifs,
  canRun: canScanPifs,
  isRunning: isScanningPifs,
  errorMessage: scanPifsErrorMessage,
} = useHostScanPifsJob(() => host)
</script>
