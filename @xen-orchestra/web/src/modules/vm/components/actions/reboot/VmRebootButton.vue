<template>
  <MenuItem
    v-if="canDisplay"
    accent="neutral"
    :disabled="!canReboot"
    icon="action:reboot"
    :busy="isRunning"
    @click="openModal()"
  >
    {{ t('action:reboot') }}
    <i v-if="!canReboot" class="em-dash-prefix">{{ t('vm-tools-missing') }}</i>
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmActionModal } from '@/modules/vm/composables/use-vm-action-modal.composable.ts'
import { useXo5VmRoute } from '@/modules/vm/composables/xo-vm-route-xo5.composable.ts'
import { useXoVmRebootJob } from '@/modules/vm/jobs/xo-vm-reboot.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { isVmAllowingOperation, isVmMissingGuestToolsFor } from '@/modules/vm/utils/xo-vm.util.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useBlockedModal } from '@core/composables/modals/use-blocked-modal.ts'
import { VM_OPERATIONS } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { run: reboot, canRun, isRunning } = useXoVmRebootJob(() => [vm])
const { xo5VmAdvancedHref } = useXo5VmRoute(() => vm)

const canReboot = computed(() => !isVmMissingGuestToolsFor(vm, VM_OPERATIONS.CLEAN_REBOOT))

const canDisplay = computed(() => canRun.value || isVmAllowingOperation(vm, VM_OPERATIONS.CLEAN_REBOOT))

const { openVmActionModal } = useVmActionModal()

const { open: openBlockedModal } = useBlockedModal()

const openModal = () => {
  if (!canRun.value) {
    return openBlockedModal({
      props: { blockedOperation: 'clean_reboot', href: xo5VmAdvancedHref.value },
    })
  }

  return openVmActionModal('reboot', [vm], () => reboot({ detached: true }))
}
</script>
