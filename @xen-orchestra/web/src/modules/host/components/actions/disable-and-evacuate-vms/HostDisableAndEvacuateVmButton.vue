<template>
  <MenuItem
    v-tooltip="!canDisableAndEvacuateVMHost && disableAndEvacuateVMHostErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canDisableAndEvacuateVMHost"
    icon="action:disable-and-evacuate"
    :busy="isDisablingAndEvacuateVMHost"
    @click="openDisableHostModal()"
  >
    {{ t('action:disable-host-and-evacuate-vm') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostDisableJob } from '@/modules/host/jobs/xo-host-disable.job.ts'
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
  run: disableAndEvacuateVMHost,
  canRun: canDisableAndEvacuateVMHost,
  isRunning: isDisablingAndEvacuateVMHost,
  errorMessage: disableAndEvacuateVMHostErrorMessage,
} = useXoHostDisableJob(() => host, true)

const openDisableHostModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: {
    accent: 'warning',
    action: 'disable-and-evacuate-vm',
    object: 'host',
    hostName: host.name_label,
    icon: 'status:warning-picto',
  },
  onConfirm: () => disableAndEvacuateVMHost(),
})
</script>
