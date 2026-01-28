<template>
  <MenuItem v-if="(isPaused && canRun) || isRunning" icon="fa:play" :busy="isRunning" @click="unpauseJob">
    {{ t('action:resume') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmUnpauseJob } from '@/modules/vm/jobs/xo-vm-unpause.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import { VM_POWER_STATE, type XoVm } from '@vates/types'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: unpause, canRun, isRunning } = useXoVmUnpauseJob(() => [vm])

const isPaused = computed(() => vm.power_state === VM_POWER_STATE.PAUSED)

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function unpauseJob() {
  unpause()
  closeMenu?.()
}
</script>
