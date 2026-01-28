<template>
  <MenuItem v-if="(isSuspended && canRun) || isRunning" icon="fa:play" :busy="isRunning" @click="resumeJob">
    {{ t('action:resume') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmResumeJob } from '@/modules/vm/jobs/xo-vm-resume.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import { VM_POWER_STATE, type XoVm } from '@vates/types'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: resume, canRun, isRunning } = useXoVmResumeJob(() => [vm])

const isSuspended = computed(() => vm.power_state === VM_POWER_STATE.SUSPENDED)

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function resumeJob() {
  resume()
  closeMenu?.()
}
</script>
