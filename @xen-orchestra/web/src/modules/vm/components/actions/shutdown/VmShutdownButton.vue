<template>
  <MenuItem :disabled="!canShutdown" icon="action:shutdown" :busy="isRunning" @click="openModal">
    {{ t('action:shutdown') }}
    <i v-if="!canShutdown" class="typo">{{ t('vm-tools-missing') }}</i>
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmForceShutdownJob } from '@/modules/vm/jobs/xo-vm-force-shutdown.job.ts'
import { useXoVmShutdownJob } from '@/modules/vm/jobs/xo-vm-shutdown.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import type { XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: shutdown, canRun, isRunning } = useXoVmShutdownJob(() => [vm])
const { run: forceShutdown } = useXoVmForceShutdownJob(() => [vm])

const { hasGuestTools } = useXoVmUtils(() => vm)

const canShutdown = computed(() => hasGuestTools(vm))

const openShutdownModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: { accent: 'info', action: 'shutdown', object: 'vm' },
  onConfirm: () => shutdown(),
})

const openBlockedModal = useModal({
  component: import('@/modules/vm/components/modal/VmShutdownBlockedModal.vue'),
  onConfirm: () => forceShutdown(),
})

const openModal = () => (canRun.value ? openShutdownModal() : openBlockedModal())
</script>
