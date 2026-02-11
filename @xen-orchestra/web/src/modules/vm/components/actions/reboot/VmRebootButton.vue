<template>
  <MenuItem v-if="canDisplay" :disabled="!canReboot" icon="action:reboot" :busy="isRunning" @click="openModal()">
    {{ t('action:reboot') }}
    <i v-if="!canReboot">{{ t('vm-tools-missing') }}</i>
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmRebootJob } from '@/modules/vm/jobs/xo-vm-reboot.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { VM_POWER_STATE, type XoVm } from '@vates/types'
import { logicOr } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: reboot, canRun, isRunning } = useXoVmRebootJob(() => [vm])
const { hasGuestTools, xo5VmAdvancedHref } = useXoVmUtils(() => vm)

const canReboot = computed(() => hasGuestTools(vm))

const canDisplay = logicOr(
  () => canRun.value,
  vm.power_state === VM_POWER_STATE.RUNNING,
  vm.power_state === VM_POWER_STATE.PAUSED
)

const openRebootModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: { accent: 'info', action: 'reboot', object: 'vm' },
  onConfirm: () => reboot(),
})

const openBlockedModal = useModal({
  component: import('@core/components/modal/VtsBlockedModal.vue'),
  props: { blockedOperation: 'clean_reboot', href: xo5VmAdvancedHref },
})

const openModal = () => (canRun.value ? openRebootModal() : openBlockedModal())
</script>
