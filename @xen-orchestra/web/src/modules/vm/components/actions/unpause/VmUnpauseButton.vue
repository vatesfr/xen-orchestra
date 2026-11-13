<template>
  <MenuItem
    v-if="(isPaused && canRun) || isRunning"
    accent="neutral"
    icon="fa:play"
    :busy="isRunning"
    @click="unpauseJob()"
  >
    {{ t('action:resume') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmUnpauseJob } from '@/modules/vm/jobs/xo-vm-unpause.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { isVmAllowingOperation } from '@/modules/vm/utils/xo-vm.util.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import { VM_OPERATIONS } from '@vates/types'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { run: unpause, canRun, isRunning } = useXoVmUnpauseJob(() => [vm])

const isPaused = computed(() => isVmAllowingOperation(vm, VM_OPERATIONS.UNPAUSE))

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function unpauseJob() {
  unpause()
  closeMenu?.()
}
</script>
