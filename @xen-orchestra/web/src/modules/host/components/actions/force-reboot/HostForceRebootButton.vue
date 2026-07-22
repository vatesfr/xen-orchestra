<template>
  <MenuItem
    v-tooltip="!canForceRebootHost && forceRebootHostErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canForceRebootHost"
    icon="action:force-reboot"
    :busy="isForceRebootingHost"
    @click="openForceRebootHostModal()"
  >
    {{ t('action:force-reboot') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostShutdownJob } from '@/modules/host/jobs/xo-host-shutdown.job.ts'
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
  run: forceRebootHost,
  canRun: canForceRebootHost,
  isRunning: isForceRebootingHost,
  errorMessage: forceRebootHostErrorMessage,
} = useXoHostShutdownJob(() => host)

const openForceRebootHostModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: {
    accent: 'warning',
    action: 'force-reboot',
    object: 'host',
    hostName: host.name_label,
    icon: 'status:warning-picto',
  },
  onConfirm: () => forceRebootHost(),
})
</script>
