<template>
  <MenuItem v-if="canDisplay" :disabled="!canShutdown" icon="action:shutdown" :busy="isRunning" @click="openModal()">
    {{ t('action:shutdown') }}
    <i v-if="!canShutdown" class="em-dash-prefix">{{ t('vm-tools-missing') }}</i>
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmShutdownJob } from '@/modules/vm/jobs/xo-vm-shutdown.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { useBlockedModal } from '@core/composables/modals/use-blocked-modal.ts'
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

const { open: openBlockedModal } = useBlockedModal()

const { open: openShutdownModal } = useActionModal()

const openModal = () => {
  if (!canRun.value) {
    return openBlockedModal({ props: { blockedOperation: 'clean_shutdown', href: xo5VmAdvancedHref.value } })
  }

  openShutdownModal({
    events: { onConfirm: () => shutdown() },
    props: { accent: 'info', action: 'shutdown', object: 'vm', icon: 'status:info-picto' },
  })
}
</script>
