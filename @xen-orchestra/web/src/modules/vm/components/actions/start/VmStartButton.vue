<template>
  <MenuItem v-if="canRun || isRunning" icon="fa:play" :busy="isRunning" @click="startJob">
    {{ t('action:start') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoVmStartJob } from '@/modules/vm/jobs/xo-vm-start.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import type { XoVm } from '@vates/types'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: start, canRun, isRunning } = useXoVmStartJob(() => [vm])

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function startJob() {
  start()
  closeMenu?.()
}
</script>
