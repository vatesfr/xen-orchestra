<template>
  <MenuItem
    v-tooltip="!canRebootHost && rebootHostErrorMessage"
    :disabled="!canRebootHost"
    icon="action:reboot"
    :busy="isRebootingHost"
    @click="openRebootHostModal()"
  >
    {{ t('action:reboot') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostRebootJob } from '@/modules/host/jobs/xo-host-reboot.job.ts'
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
  run: rebootHost,
  canRun: canRebootHost,
  isRunning: isRebootingHost,
  errorMessage: rebootHostErrorMessage,
} = useXoHostRebootJob(() => host)

const openRebootHostModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: {
    accent: 'warning',
    action: 'reboot',
    object: 'host',
    hostName: host.name_label,
    icon: 'status:warning-picto',
  },
  onConfirm: () => rebootHost(),
})
</script>
