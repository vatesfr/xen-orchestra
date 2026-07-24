<template>
  <MenuItem v-if="canDisplay" icon="fa:pause" :busy="isRunning" @click="pauseJob()">
    {{ t('pause') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmPauseJob } from '@/modules/vm/jobs/xo-vm-pause.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useBlockedModal } from '@core/composables/modals/use-blocked-modal.ts'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import { VM_POWER_STATE } from '@vates/types'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { run: pause, canRun, isRunning } = useXoVmPauseJob(() => [vm])
const { xo5VmAdvancedHref } = useXoVmUtils(() => vm)

const canDisplay = computed(() => {
  return canRun.value || vm.power_state === VM_POWER_STATE.RUNNING
})

const closeMenu = inject(IK_CLOSE_MENU, undefined)

const { open: openBlockedModal } = useBlockedModal()

function pauseJob() {
  if (!canRun.value) {
    return openBlockedModal({ props: { blockedOperation: 'pause', href: xo5VmAdvancedHref.value } })
  }

  pause()
  closeMenu?.()
}
</script>
