<template>
  <UiButton
    v-tooltip="!canEnableHost"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canEnableHost"
    left-icon="status:success-circle"
    :busy="isEnabingHost"
    @click="enableHost()"
  >
    {{ t('action:enable-host') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useXoHostEnableJob } from '@/modules/host/jobs/xo-host-enable-host.job.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const { run: enableHost, canRun: canEnableHost, isRunning: isEnabingHost } = useXoHostEnableJob(() => host)
</script>
