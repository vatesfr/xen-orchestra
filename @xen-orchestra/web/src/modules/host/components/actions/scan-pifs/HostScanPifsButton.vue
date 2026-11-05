<template>
  <UiButton
    v-tooltip="!canScanPifs && scanPifsErrorMessage"
    size="medium"
    variant="secondary"
    accent="brand"
    :disabled="!canScanPifs"
    left-icon="action:scan"
    :busy="isScanningPifs"
    @click="scanPifs()"
  >
    {{ t('scan-pifs') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useXoHostScanPifsJob } from '@/modules/host/jobs/xo-host-scan-pifs.job.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const {
  run: scanPifs,
  canRun: canScanPifs,
  isRunning: isScanningPifs,
  errorMessage: scanPifsErrorMessage,
} = useXoHostScanPifsJob(() => host)
</script>
