<template>
  <VtsActionButton
    v-if="canRun || isRunning"
    variant="tertiary"
    accent="brand"
    icon="fa:play"
    :busy="isRunning"
    @click="startJob()"
  >
    {{ t('action:start') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useXoVmStartJob } from '@/modules/vm/jobs/xo-vm-start.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
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
