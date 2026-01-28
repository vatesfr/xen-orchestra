<template>
  <MenuItem v-if="canRun || isRunning" icon="action:force-reboot" :busy="isRunning" @click="openRebootModal">
    {{ t('action:force-reboot') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmForceRebootJob } from '@/modules/vm/jobs/xo-vm-force-reboot.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import type { XoVm } from '@vates/types'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: forceReboot, canRun, isRunning } = useXoVmForceRebootJob(() => [vm])

const openRebootModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: { accent: 'info', action: 'force-reboot', object: 'vm' },
  onConfirm: () => forceRebootJob(),
})

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function forceRebootJob() {
  forceReboot()
  closeMenu?.()
}
</script>
