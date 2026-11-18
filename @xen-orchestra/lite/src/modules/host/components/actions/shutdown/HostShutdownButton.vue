<template>
  <VtsActionButton
    variant="tertiary"
    accent="brand"
    :busy="isShuttingDownHost"
    :disabled="!canShutdownHost"
    icon="action:shutdown"
    :hint="shutdownHostErrorMessage"
    @click="shutdownHost()"
  >
    {{ t('action:shutdown') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostShutdownJob } from '@/modules/host/jobs/host-shutdown.job.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const { open: openActionModal } = useActionModal()

const {
  run,
  canRun: canShutdownHost,
  isRunning: isShuttingDownHost,
  errorMessage: shutdownHostErrorMessage,
} = useHostShutdownJob(() => host)

function shutdownHost() {
  return openActionModal({
    props: {
      accent: 'info',
      action: 'shutdown',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:info-picto',
    },
    events: {
      onConfirm: async () => {
        void run()
      },
    },
  })
}
</script>
