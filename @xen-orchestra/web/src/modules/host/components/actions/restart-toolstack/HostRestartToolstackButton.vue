<template>
  <MenuItem
    v-tooltip="!canRestartToolstack && restartToolstackErrorMessage"
    :disabled="!canRestartToolstack"
    icon="action:reboot"
    :busy="isRestartingToolstack"
    @click="restartToolstack()"
  >
    {{ t('action:restart-toolstack') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostRestartToolstackJob } from '@/modules/host/jobs/xo-host-restart-toolstack.job.ts'
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
  canRun: canRestartToolstack,
  isRunning: isRestartingToolstack,
  errorMessage: restartToolstackErrorMessage,
} = useXoHostRestartToolstackJob(() => host)

const { open: openActionModal } = useActionModal()

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
