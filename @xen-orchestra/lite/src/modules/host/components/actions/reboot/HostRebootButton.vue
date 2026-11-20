<template>
  <VtsActionButton
    variant="tertiary"
    accent="brand"
    :busy="isRebootingHost"
    :disabled="!canRebootHost"
    icon="action:reboot"
    :hint="rebootHostErrorMessage"
    @click="rebootHost()"
  >
    {{ t('action:reboot') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostRebootJob } from '@/modules/host/jobs/host-reboot.job.ts'
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
  canRun: canRebootHost,
  isRunning: isRebootingHost,
  errorMessage: rebootHostErrorMessage,
} = useHostRebootJob(() => host, false)

function rebootHost() {
  return openActionModal({
    props: {
      accent: 'info',
      action: 'reboot',
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
