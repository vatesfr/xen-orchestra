<template>
  <MenuItem v-if="(isSuspended && canRun) || isRunning" icon="fa:play" :busy="isRunning" @click="resume">
    {{ t('action:resume') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmResumeJob } from '@/modules/vm/jobs/xo-vm-resume.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { VM_POWER_STATE, type XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: resume, canRun, isRunning } = useVmResumeJob(() => [vm])

const isSuspended = computed(() => vm.power_state === VM_POWER_STATE.SUSPENDED)
</script>
