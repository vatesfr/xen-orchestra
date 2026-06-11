<template>
  <MenuItem icon="action:disconnect" :busy="isRunning" :disabled="!canRun" @click="disconnectVdi()">
    {{ t('action:disconnect') }}
    <i v-if="hint">{{ hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoVbdDisconnectJob } from '@/modules/vbd/jobs/xo-vbd-disconnect.job.ts'
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

const { run, canRun, isRunning } = useXoVbdDisconnectJob(() => (vbd ? [vbd] : []), vm)

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function disconnectVdi() {
  run()
  closeMenu?.()
}

const hint = computed(() => {
  if (!vm || !vbd) return t('vdi-not-attached-to-vm')
  return undefined
})
</script>
