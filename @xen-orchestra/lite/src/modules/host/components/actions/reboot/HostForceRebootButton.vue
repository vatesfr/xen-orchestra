<template>
  <MenuItem
    v-tooltip="!canForceRebootHost && forceRebootHostErrorMessage"
    :busy="isForceRebootingHost"
    :disabled="!canForceRebootHost"
    icon="action:force-reboot"
    @click="forceRebootHost()"
  >
    {{ t('action:force-reboot') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostRebootJob } from '@/modules/host/jobs/host-reboot.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const { open: openActionModal } = useActionModal()

const {
  run,
  canRun: canForceRebootHost,
  isRunning: isForceRebootingHost,
  errorMessage: forceRebootHostErrorMessage,
} = useHostRebootJob(() => host, true)

function forceRebootHost() {
  return openActionModal({
    props: {
      accent: 'info',
      action: 'force-reboot',
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
