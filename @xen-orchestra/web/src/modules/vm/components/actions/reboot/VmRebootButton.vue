<template>
  <MenuItem
    v-if="canRun || isRunning"
    :disabled="!canReboot"
    icon="action:reboot"
    :busy="isRunning"
    @click="openRebootModal"
  >
    {{ t('action:reboot') }}
    <i v-if="!canReboot">{{ t('vm-tools-missing') }}</i>
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmRebootJob } from '@/modules/vm/jobs/xo-vm-reboot.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import type { XoVm } from '@vates/types'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: reboot, canRun, isRunning } = useXoVmRebootJob(() => [vm])
const { hasGuestTools } = useXoVmUtils(() => vm)

const canReboot = computed(() => hasGuestTools(vm))

const openRebootModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: { accent: 'info', action: 'reboot', object: 'vm' },
  onConfirm: () => rebootJob(),
})

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function rebootJob() {
  reboot()
  closeMenu?.()
}
</script>
