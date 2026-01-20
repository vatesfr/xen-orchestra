<template>
  <MenuItem
    v-if="(vm.power_state === VM_POWER_STATE.SUSPENDED && canRun) || isRunning"
    icon="fa:play"
    :busy="isRunning"
    @click="resume"
  >
    {{ t('action:resume') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmResumeJob } from '@/jobs/vm/vm-resume.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { VM_POWER_STATE, type XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: resume, canRun, isRunning } = useVmResumeJob(() => [vm])
</script>
