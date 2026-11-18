<template>
  <VtsActionButton
    variant="tertiary"
    accent="brand"
    :disabled="!canShutdownHost"
    icon="action:shutdown"
    :busy="isShuttingDownHost"
    :hint="shutdownHostErrorMessage"
    @click="shutdownHost()"
  >
    {{ t('action:shutdown') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useXoHostShutdownJob } from '@/modules/host/jobs/xo-host-shutdown.job.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
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
} = useXoHostShutdownJob(() => host, false)

const { open: openActionModal } = useActionModal()

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
      onConfirm: () => run({ detached: true }),
    },
  })
}
</script>
