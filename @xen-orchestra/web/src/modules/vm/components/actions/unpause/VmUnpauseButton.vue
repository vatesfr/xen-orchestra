<template>
  <VtsActionButton
    v-if="(isPaused && canRun) || isRunning"
    variant="tertiary"
    accent="brand"
    icon="fa:play"
    :busy="isRunning"
    @click="unpauseJob()"
  >
    {{ t('action:resume') }}
  </VtsActionButton>
</template>

<script setup lang="ts">
import { useXoVmUnpauseJob } from '@/modules/vm/jobs/xo-vm-unpause.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { isVmAllowingOperation } from '@/modules/vm/utils/xo-vm.util.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { IK_CLOSE_MENU } from '@core/utils/injection-keys.util.ts'
import { VM_OPERATIONS } from '@vates/types'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { run: unpause, canRun, isRunning } = useXoVmUnpauseJob(() => [vm])

const isPaused = computed(() => isVmAllowingOperation(vm, VM_OPERATIONS.UNPAUSE))

const closeMenu = inject(IK_CLOSE_MENU, undefined)

function unpauseJob() {
  unpause()
  closeMenu?.()
}
</script>
