<template>
  <MenuItem
    v-tooltip="!canSmartRebootHost && smartRebootHostErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canSmartRebootHost"
    icon="action:smart-reboot"
    :busy="isSmartRebootingHost"
    @click="openForceRebootHostModal()"
  >
    {{ t('action:smart-reboot') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostSmartRebootJob } from '@/modules/host/jobs/xo-host-smart-reboot.job.ts'
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
  run: smartRebootHost,
  canRun: canSmartRebootHost,
  isRunning: isSmartRebootingHost,
  errorMessage: smartRebootHostErrorMessage,
} = useXoHostSmartRebootJob(() => host)

const openForceRebootHostModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: {
    accent: 'warning',
    action: 'smart-reboot',
    object: 'host',
    hostName: host.name_label,
    icon: 'status:warning-picto',
  },
  onConfirm: () => smartRebootHost(),
})
</script>
