<template>
  <MenuItem
    v-tooltip="!canShutdownHost && shutdownHostErrorMessage"
    accent="brand"
    :disabled="!canShutdownHost"
    icon="action:shutdown"
    :busy="isShuttingDownHost"
    @click="shutdownHost()"
  >
    {{ t('action:shutdown') }}
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
  canRun: canShutdownHost,
  isRunning: isShuttingDownHost,
  errorMessage: shutdownHostErrorMessage,
} = useXoHostShutdownJob(() => host)

const { open: openActionModal } = useActionModal()

function shutdownHost() {
  openActionModal({
    events: {
      onConfirm: () => run(),
    },
    props: {
      accent: 'info',
      action: 'shutdown',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:info-picto',
    },
  })
}
</script>
