<template>
  <UiButton
    v-tooltip="!canDisableHost && disableHostErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canDisableHost"
    left-icon="action:disable"
    :busy="isDisablingHost"
    @click="disableHost()"
  >
    {{ t('action:disable-host') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useXoHostDisableJob } from '@/modules/host/jobs/xo-host-disable-host.job.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const {
  run: disableHost,
  canRun: canDisableHost,
  isRunning: isDisablingHost,
  errorMessage: disableHostErrorMessage,
} = useXoHostDisableJob(() => host)
</script>
