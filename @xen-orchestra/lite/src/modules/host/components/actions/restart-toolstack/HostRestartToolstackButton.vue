<template>
  <MenuItem
    v-tooltip="!canRestartToolstack && restartToolstackErrorMessage"
    accent="neutral"
    :busy="isRestartingToolstack"
    :disabled="!canRestartToolstack"
    icon="action:reboot"
    @click="restartToolstack()"
  >
    {{ t('action:restart-toolstack') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostRestartToolstackJob } from '@/modules/host/jobs/host-restart-toolstack.job.ts'
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
  canRun: canRestartToolstack,
  isRunning: isRestartingToolstack,
  errorMessage: restartToolstackErrorMessage,
} = useHostRestartToolstackJob(() => host)

function restartToolstack() {
  return openActionModal({
    props: {
      accent: 'info',
      action: 'restart-toolstack',
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
