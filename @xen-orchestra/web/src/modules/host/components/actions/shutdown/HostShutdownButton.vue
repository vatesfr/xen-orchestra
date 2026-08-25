<template>
  <MenuItem
    v-tooltip="shutdownHostDisabledMessage"
    :disabled="!canShutdownHost || isRestartingToolstack"
    icon="action:shutdown"
    :busy="isShuttingDownHost"
    @click="shutdownHost()"
  >
    {{ t('action:shutdown') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostRestartToolstackJob } from '@/modules/host/jobs/xo-host-restart-toolstack.job.ts'
import { useXoHostShutdownJob } from '@/modules/host/jobs/xo-host-shutdown.job.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const { isRunning: isRestartingToolstack } = useXoHostRestartToolstackJob(() => host)

const {
  run,
  canRun: canShutdownHost,
  isRunning: isShuttingDownHost,
  errorMessage: shutdownHostErrorMessage,
} = useXoHostShutdownJob(() => host)

const shutdownHostDisabledMessage = computed(() => {
  if (isRestartingToolstack.value) {
    return t('job:host-restart-toolstack:in-progress')
  }

  return canShutdownHost.value ? undefined : shutdownHostErrorMessage.value
})

const { open: openActionModal } = useActionModal()

function shutdownHost() {
  openActionModal({
    events: {
      onConfirm: () => run(),
    },
    props: {
      accent: 'warning',
      action: 'shutdown',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:warning-picto',
    },
  })
}
</script>
