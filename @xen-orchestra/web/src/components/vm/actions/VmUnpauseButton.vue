<template>
  <MenuItem
    v-if="(vm.power_state === VM_POWER_STATE.PAUSED && canRun) || isRunning"
    icon="fa:play"
    :busy="isRunning"
    @click="unpause"
  >
    {{ t('resume') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmUnpauseJob } from '@/jobs/vm/vm-unpause.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { VM_POWER_STATE, type XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: unpause, canRun, isRunning } = useVmUnpauseJob(() => [vm])
</script>
