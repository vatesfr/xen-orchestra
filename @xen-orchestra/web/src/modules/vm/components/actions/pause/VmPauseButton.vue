<template>
  <MenuItem v-if="canDisplay" icon="fa:pause" :busy="isRunning" @click="openModal()">
    {{ t('pause') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmPauseJob } from '@/modules/vm/jobs/xo-vm-pause.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import { VM_POWER_STATE, type XoVm } from '@vates/types'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: pause, canRun, isRunning } = useXoVmPauseJob(() => [vm])
const { xo5VmAdvancedHref } = useXoVmUtils(() => vm)

const canDisplay = computed(() => {
  return canRun.value || vm.power_state === VM_POWER_STATE.RUNNING
})

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function pauseJob() {
  pause()
  closeMenu?.()
}

const openBlockedModal = useModal({
  component: import('@core/components/modal/VtsBlockedModal.vue'),
  props: { blockedOperation: 'pause', href: xo5VmAdvancedHref },
})

const openModal = () => (canRun.value ? pauseJob() : openBlockedModal())
</script>
