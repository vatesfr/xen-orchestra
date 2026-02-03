<template>
  <MenuItem v-if="canDisplay" icon="action:force-shutdown" :busy="isRunning" @click="openModal()">
    {{ t('action:force-shutdown') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmForceShutdownJob } from '@/modules/vm/jobs/xo-vm-force-shutdown.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { VM_POWER_STATE, type XoVm } from '@vates/types'
import { logicOr } from '@vueuse/math'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: forceShutdown, canRun, isRunning } = useXoVmForceShutdownJob(() => [vm])

const { xo5VmAdvancedHref } = useXoVmUtils(() => vm)

const canDisplay = logicOr(
  () => canRun.value,
  vm.power_state === VM_POWER_STATE.RUNNING,
  vm.power_state === VM_POWER_STATE.SUSPENDED,
  vm.power_state === VM_POWER_STATE.PAUSED
)

const openRebootModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: { accent: 'info', action: 'force-shutdown', object: 'vm' },
  onConfirm: () => forceShutdown(),
})

const openBlockedModal = useModal({
  component: import('@core/components/modal/VtsBlockedModal.vue'),
  props: { blockedOperation: 'hard_shutdown', href: xo5VmAdvancedHref },
})

const openModal = () => (canRun.value ? openRebootModal() : openBlockedModal())
</script>
