<template>
  <MenuItem
    v-tooltip="!canDisableHostAndEvacuateVMs && disableHostAndEvacuateVMsErrorMessage"
    accent="brand"
    :disabled="!canDisableHostAndEvacuateVMs"
    icon="action:disable-and-evacuate"
    :busy="isDisablingHostAndEvacuatingVMs"
    @click="disableHostAndEvacuateVms()"
  >
    {{ t('action:disable-and-evacuate-vms') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostDisableJob } from '@/modules/host/jobs/xo-host-disable.job.ts'
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
  canRun: canDisableHostAndEvacuateVMs,
  isRunning: isDisablingHostAndEvacuatingVMs,
  errorMessage: disableHostAndEvacuateVMsErrorMessage,
} = useXoHostDisableJob(() => host, true)

const { open: openActionModal } = useActionModal()

function disableHostAndEvacuateVms() {
  openActionModal({
    events: {
      onConfirm: () => run(),
    },
    props: {
      accent: 'info',
      action: 'disable-and-evacuate-vms',
      object: 'host',
      hostName: host.name_label,
      icon: 'status:info-picto',
    },
  })
}
</script>
