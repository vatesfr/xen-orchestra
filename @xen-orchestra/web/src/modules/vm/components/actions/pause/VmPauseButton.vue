<template>
  <MenuItem v-if="canDisplay" accent="neutral" icon="fa:pause" :busy="isRunning" @click="pauseJob()">
    {{ t('pause') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useXo5VmRoute } from '@/modules/vm/composables/xo-vm-route-xo5.composable.ts'
import { useXoVmPauseJob } from '@/modules/vm/jobs/xo-vm-pause.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { isVmAllowingOperation } from '@/modules/vm/utils/xo-vm.util.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useBlockedModal } from '@core/composables/modals/use-blocked-modal.ts'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import { VM_OPERATIONS } from '@vates/types'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { run: pause, canRun, isRunning } = useXoVmPauseJob(() => [vm])
const { xo5VmAdvancedHref } = useXo5VmRoute(() => vm)

const canDisplay = computed(() => canRun.value || isVmAllowingOperation(vm, VM_OPERATIONS.PAUSE))

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
