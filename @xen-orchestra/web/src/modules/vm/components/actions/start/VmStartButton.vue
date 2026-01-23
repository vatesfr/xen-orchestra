<template>
  <MenuItem v-if="canRun || isRunning" icon="fa:play" :busy="isRunning" @click="startJob()">
    {{ t('action:start') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoVmStartJob } from '@/modules/vm/jobs/xo-vm-start.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { run: start, canRun, isRunning } = useXoVmStartJob(() => [vm])

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function startJob() {
  start()
  closeMenu?.()
}
</script>
