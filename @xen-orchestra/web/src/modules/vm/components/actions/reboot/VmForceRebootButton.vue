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
import { useModal } from '@core/packages/modal/use-modal.ts'
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

const openRebootModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: { accent: 'info', action: 'force-reboot', object: 'vm' },
  onConfirm: () => forceReboot(),
})

const openBlockedModal = useModal({
  component: import('@core/components/modal/VtsBlockedModal.vue'),
  props: { blockedOperation: 'hard_reboot', href: xo5VmAdvancedHref },
})

const openModal = () => (canRun.value ? openRebootModal() : openBlockedModal())
</script>
