<template>
  <MenuItem
    v-tooltip="!canRebootHost && rebootHostErrorMessage"
    :busy="isRebootingHost"
    :disabled="!canRebootHost"
    icon="action:reboot"
    @click="rebootHost()"
  >
    {{ t('action:reboot') }}
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
  canRun: canRebootHost,
  isRunning: isRebootingHost,
  errorMessage: rebootHostErrorMessage,
} = useHostRebootJob(() => host)

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
