<template>
  <MenuItem v-if="canRun || isRunning" icon="fa:stop" :busy="isRunning" @click="openShutdownModal">
    {{ t('action:shutdown') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmShutdownJob } from '@/modules/vm/jobs/xo-vm-shutdown.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import type { XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: shutdown, canRun, isRunning } = useVmShutdownJob(() => [vm])

const openShutdownModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: { name: vm.name_label, action: 'shutdown' },
  onConfirm: () => shutdown(),
})
</script>
