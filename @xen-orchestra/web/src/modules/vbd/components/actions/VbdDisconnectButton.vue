<template>
  <UiButton
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canRun"
    left-icon="status:disabled"
    :busy="isRunning"
    @click="openDisconnectModal()"
  >
    {{ t('action:disconnect') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useXoVbdDisconnectJob } from '@/modules/vbd/jobs/xo-vbd-disconnect.job.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { useI18n } from 'vue-i18n'

const { vbd, vm } = defineProps<{
  vbd?: FrontXoVbd
  vm: FrontXoVm
}>()

const { t } = useI18n()

const {
  run: disconnectVbd,
  canRun,
  isRunning,
} = useXoVbdDisconnectJob(
  () => [vbd],
  () => vm
)

const openDisconnectModal = useModal({
  component: import('@/modules/vbd/components/modal/VbdDisconnectModal.vue'),
  props: { count: 1 },
  onConfirm: async () => {
    try {
      await disconnectVbd()
    } catch (error) {
      console.error('Error when disconnecting VBD:', error)
    }
  },
})
</script>
