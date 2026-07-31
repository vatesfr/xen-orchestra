<template>
  <MenuItem
    v-tooltip="!canDisableAndEvacuateVmsHost && disableAndEvacuateVmsHostErrorMessage"
    :disabled="!canDisableAndEvacuateVmsHost"
    icon="action:disable-and-evacuate"
    :busy="isDisablingAndEvacuateVmsHost"
    @click="openDisableAndEvacuateVmsHostModal()"
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
  run: disableAndEvacuateVmsHost,
  canRun: canDisableAndEvacuateVmsHost,
  isRunning: isDisablingAndEvacuateVmsHost,
  errorMessage: disableAndEvacuateVmsHostErrorMessage,
} = useXoHostDisableJob(() => host, true)

const openDisableAndEvacuateVmsHostModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: {
    accent: 'warning',
    action: 'disable-and-evacuate-vm',
    object: 'host',
    hostName: host.name_label,
    icon: 'status:warning-picto',
  },
  onConfirm: () => disableAndEvacuateVmsHost(),
})
</script>
