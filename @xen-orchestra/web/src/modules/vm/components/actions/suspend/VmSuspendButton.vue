<template>
  <MenuItem v-if="canRun || isRunning" :disabled="!canSuspend" icon="fa:moon" :busy="isRunning" @click="suspendJob">
    {{ t('action:suspend') }}
    <i v-if="!canSuspend">{{ t('vm-tools-missing') }}</i>
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmSuspendJob } from '@/modules/vm/jobs/xo-vm-suspend.jobs.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import type { XoVm } from '@vates/types'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: suspend, canRun, isRunning } = useXoVmSuspendJob(() => [vm])
const { hasGuestTools } = useXoVmUtils(() => vm)

const canSuspend = computed(() => hasGuestTools(vm))

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function suspendJob() {
  suspend()
  closeMenu?.()
}
</script>
