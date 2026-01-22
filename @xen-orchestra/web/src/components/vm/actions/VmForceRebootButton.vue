<template>
  <MenuItem v-if="canRun || isRunning" icon="fa:repeat" :busy="isRunning" @click="openRebootModal">
    {{ t('action:force-reboot') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmForceRebootJob } from '@/jobs/vm/vm-force-reboot.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import type { XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: hard_reboot, canRun, isRunning } = useVmForceRebootJob(() => [vm])

const openRebootModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: { name: vm.name_label, action: 'reboot' },
  onConfirm: () => hard_reboot(),
})
</script>
