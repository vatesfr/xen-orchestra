<template>
  <MenuItem v-if="canRun || isRunning" icon="action:snapshot" :busy="isRunning" @click="snapshotJob">
    {{ t('snapshot') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoVmSnapshotJob } from '@/modules/vm/jobs/xo-vm-snapshot.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import type { XoVm } from '@vates/types'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: snapshot, canRun, isRunning } = useXoVmSnapshotJob(() => [vm])

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function snapshotJob() {
  snapshot()
  closeMenu?.()
}
</script>
