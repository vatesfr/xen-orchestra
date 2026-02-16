<template>
  <MenuItem v-if="canDisplay" :disabled="!canShutdown" icon="action:shutdown" :busy="isRunning" @click="openModal()">
    {{ t('action:shutdown') }}
    <i v-if="!canShutdown" class="typo">{{ t('vm-tools-missing') }}</i>
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmShutdownJob } from '@/modules/vm/jobs/xo-vm-shutdown.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { VM_POWER_STATE } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { run: shutdown, canRun, isRunning } = useXoVmShutdownJob(() => [vm])

const { hasGuestTools, xo5VmAdvancedHref } = useXoVmUtils(() => vm)

const canShutdown = computed(() => hasGuestTools(vm))

const canDisplay = computed(() => {
  return canRun.value || vm.power_state === VM_POWER_STATE.RUNNING
})

const openShutdownModal = useModal({
  component: import('@core/components/modal/VtsActionModal.vue'),
  props: { accent: 'info', action: 'shutdown', object: 'vm' },
  onConfirm: () => shutdown(),
})

const openBlockedModal = useModal({
  component: import('@core/components/modal/VtsBlockedModal.vue'),
  props: { blockedOperation: 'clean_shutdown', href: xo5VmAdvancedHref },
})

const openModal = () => (canRun.value ? openShutdownModal() : openBlockedModal())
</script>
