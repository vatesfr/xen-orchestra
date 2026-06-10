<template>
  <MenuItem icon="action:connect" :busy="isRunning" :disabled="!canRun" @click="connectVdi()">
    {{ t('action:connect') }}
    <i v-if="hint">{{ hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoVbdConnectJob } from '@/modules/vbd/jobs/xo-vbd-connect.job.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm, vbd } = defineProps<{
  vm?: FrontXoVm
  vbd?: FrontXoVbd
}>()

const { t } = useI18n()

const { run, canRun, isRunning } = useXoVbdConnectJob(() => (vbd ? [vbd] : []), vm)

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function connectVdi() {
  run()
  closeMenu?.()
}

const hint = computed(() => {
  if (!vm || !vbd) return t('vdi-not-attached-to-VM')
  return undefined
})
</script>
