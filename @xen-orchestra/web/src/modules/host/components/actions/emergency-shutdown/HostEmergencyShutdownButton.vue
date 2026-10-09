<template>
  <MenuItem
    v-tooltip="!canEmergencyShutdownHost && emergencyShutdownHostErrorMessage"
    accent="danger"
    :disabled="!canEmergencyShutdownHost"
    icon="action:emergency-shutdown"
    :busy="isEmergencyShuttingDownHost"
    @click="emergencyShutdownHost()"
  >
    {{ t('action:emergency-shutdown') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostShutdownJob } from '@/modules/host/jobs/xo-host-shutdown.job.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const {
  run,
  canRun: canEmergencyShutdownHost,
  isRunning: isEmergencyShuttingDownHost,
  errorMessage: emergencyShutdownHostErrorMessage,
} = useXoHostShutdownJob(() => host, true)

const { open: openActionModal } = useActionModal()

function emergencyShutdownHost() {
  return openActionModal({
    props: {
      accent: 'danger',
      action: 'emergency-shutdown',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:danger-picto',
    },
    events: {
      onConfirm: () => run({ detached: true }),
    },
  })
}
</script>
