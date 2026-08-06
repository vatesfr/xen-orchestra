<template>
  <MenuItem v-if="canDisplay" :disabled="!canReboot" icon="action:reboot" :busy="isRunning" @click="openModal()">
    {{ t('action:reboot') }}
    <i v-if="!canReboot" class="em-dash-prefix">{{ t('vm-tools-missing') }}</i>
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmRebootJob } from '@/modules/vm/jobs/xo-vm-reboot.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { useBlockedModal } from '@core/composables/modals/use-blocked-modal.ts'
import { VM_POWER_STATE } from '@vates/types'
import { logicOr } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
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

const { open: openRebootModal } = useActionModal()

const { open: openBlockedModal } = useBlockedModal()

const openModal = () => {
  if (!canRun.value) {
    return openBlockedModal({
      props: { blockedOperation: 'clean_reboot', href: xo5VmAdvancedHref.value },
    })
  }

  openRebootModal({
    events: { onConfirm: () => reboot() },
    props: { accent: 'info', action: 'reboot', object: 'vm', icon: 'status:info-picto' },
  })
}
</script>
