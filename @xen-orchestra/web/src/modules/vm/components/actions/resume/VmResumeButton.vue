<template>
  <MenuItem
    v-if="(isSuspended && canRun) || isRunning"
    accent="neutral"
    icon="fa:play"
    :busy="isRunning"
    @click="resumeJob()"
  >
    {{ t('action:resume') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmResumeJob } from '@/modules/vm/jobs/xo-vm-resume.job.ts'
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

const { run: resume, canRun, isRunning } = useXoVmResumeJob(() => [vm])

const isSuspended = computed(() => isVmAllowingOperation(vm, VM_OPERATIONS.RESUME))

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function resumeJob() {
  resume()
  closeMenu?.()
}
</script>
