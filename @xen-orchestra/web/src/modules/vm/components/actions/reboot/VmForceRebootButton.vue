<template>
  <MenuItem v-if="canDisplay" icon="action:force-reboot" :busy="isRunning" @click="openModal()">
    {{ t('action:force-reboot') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmForceRebootJob } from '@/modules/vm/jobs/xo-vm-force-reboot.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { useBlockedModal } from '@core/composables/modals/use-blocked-modal.ts'
import { VM_POWER_STATE } from '@vates/types'
import { logicOr } from '@vueuse/math'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { run: forceReboot, canRun, isRunning } = useXoVmForceRebootJob(() => [vm])

const { xo5VmAdvancedHref } = useXoVmUtils(() => vm)

const canDisplay = logicOr(
  () => canRun.value,
  vm.power_state === VM_POWER_STATE.RUNNING,
  vm.power_state === VM_POWER_STATE.PAUSED
)

const { open: openRebootModal } = useActionModal()

const { open: openBlockedModal } = useBlockedModal()

const openModal = () => {
  if (!canRun.value) {
    return openBlockedModal({
      props: { blockedOperation: 'hard_reboot', href: xo5VmAdvancedHref.value },
    })
  }

  openRebootModal({
    events: { onConfirm: () => forceReboot() },
    props: { accent: 'info', action: 'force-reboot', object: 'vm', icon: 'status:info-picto' },
  })
}
</script>
