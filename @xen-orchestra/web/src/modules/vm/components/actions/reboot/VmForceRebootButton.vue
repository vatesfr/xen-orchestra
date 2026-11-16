<template>
  <MenuItem v-if="canDisplay" accent="neutral" icon="action:force-reboot" :busy="isRunning" @click="openModal()">
    {{ t('action:force-reboot') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmActionModal } from '@/modules/vm/composables/use-vm-action-modal.composable.ts'
import { useXo5VmRoute } from '@/modules/vm/composables/xo-vm-route-xo5.composable.ts'
import { useXoVmForceRebootJob } from '@/modules/vm/jobs/xo-vm-force-reboot.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { isVmAllowingOperation } from '@/modules/vm/utils/xo-vm.util.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useBlockedModal } from '@core/composables/modals/use-blocked-modal.ts'
import { VM_OPERATIONS } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { run: forceReboot, canRun, isRunning } = useXoVmForceRebootJob(() => [vm])

const { xo5VmAdvancedHref } = useXo5VmRoute(() => vm)

const canDisplay = computed(() => canRun.value || isVmAllowingOperation(vm, VM_OPERATIONS.HARD_REBOOT))

const { openVmActionModal } = useVmActionModal()

const { open: openBlockedModal } = useBlockedModal()

const openModal = () => {
  if (!canRun.value) {
    return openBlockedModal({
      props: { blockedOperation: 'hard_reboot', href: xo5VmAdvancedHref.value },
    })
  }

  return openVmActionModal('force-reboot', [vm], () => forceReboot({ detached: true }))
}
</script>
