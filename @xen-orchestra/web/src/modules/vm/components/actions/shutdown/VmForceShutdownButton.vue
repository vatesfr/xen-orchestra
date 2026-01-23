<template>
  <MenuItem v-if="canRun || isRunning" icon="fa:plug" :busy="isRunning" @click="openRebootModal">
    {{ t('action:force-shutdown') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmForceShutdownJob } from '@/modules/vm/jobs/xo-vm-force-shutdown.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import type { XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: hard_shutdown, canRun, isRunning } = useVmForceShutdownJob(() => [vm])

const openRebootModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: { name: vm.name_label, action: 'shutdown' },
  onConfirm: () => hard_shutdown(),
})
</script>
