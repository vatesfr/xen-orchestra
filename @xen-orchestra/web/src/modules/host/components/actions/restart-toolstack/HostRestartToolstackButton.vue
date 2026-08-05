<template>
  <MenuItem
    v-tooltip="!canRestartToolstack && restartToolstackErrorMessage"
    :disabled="!canRestartToolstack"
    icon="action:reboot"
    :busy="isRestartingToolstack"
    @click="openRestartToolstackHostModal()"
  >
    {{ t('action:restart-toolstack') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostRestartToolstackJob } from '@/modules/host/jobs/xo-host-restart-toolstack.job.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const {
  run: restartToolstack,
  canRun: canRestartToolstack,
  isRunning: isRestartingToolstack,
  errorMessage: restartToolstackErrorMessage,
} = useXoHostRestartToolstackJob(() => host)

const openRestartToolstackHostModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: {
    accent: 'warning',
    action: 'restart-toolstack',
    object: 'host',
    hostName: host.name_label,
    icon: 'status:warning-picto',
  },
  onConfirm: () => restartToolstack(),
})
</script>
