<template>
  <MenuItem v-if="canRun || isRunning" icon="action:force-shutdown" :busy="isRunning" @click="openRebootModal">
    {{ t('action:force-shutdown') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmForceShutdownJob } from '@/modules/vm/jobs/xo-vm-force-shutdown.job.ts'
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

const { run: forceShutdown, canRun, isRunning } = useXoVmForceShutdownJob(() => [vm])

const openRebootModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: { accent: 'info', action: 'force-shutdown', object: 'vm' },
  onConfirm: () => forceShutdownJob(),
})

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function forceShutdownJob() {
  forceShutdown()
  closeMenu?.()
}
</script>
