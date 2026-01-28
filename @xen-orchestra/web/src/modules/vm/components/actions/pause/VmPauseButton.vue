<template>
  <MenuItem v-if="canRun || isRunning" icon="fa:pause" :busy="isRunning" @click="pauseJob">
    {{ t('pause') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmPauseJob } from '@/modules/vm/jobs/xo-vm-pause.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import type { XoVm } from '@vates/types'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: pause, canRun, isRunning } = useXoVmPauseJob(() => [vm])

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function pauseJob() {
  pause()
  closeMenu?.()
}
</script>
