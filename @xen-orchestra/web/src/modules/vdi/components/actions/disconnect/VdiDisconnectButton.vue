<template>
  <MenuItem v-if="vbd.attached" icon="action:disconnect" :busy="isRunning" :disabled="!canRun" @click="connectVdi()">
    {{ t('action:disconnect') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoVbdDisconnectJob } from '@/modules/vbd/jobs/xo-vbd-disconnect.job.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm, vbd } = defineProps<{
  vm: FrontXoVm
  vbd: FrontXoVbd
}>()

const { t } = useI18n()

const { run, canRun, isRunning } = useXoVbdDisconnectJob(vbd, vm)

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function connectVdi() {
  run()
  closeMenu?.()
}
</script>
