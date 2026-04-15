<template>
  <UiButton
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canRun"
    left-icon="status:success-circle"
    :busy="isRunning"
    @click="openConnectModal()"
  >
    {{ t('action:connect') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useXoVbdConnectJob } from '@/modules/vbd/jobs/xo-vbd-connect.job.ts'
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
  run: connectVbd,
  canRun,
  isRunning,
} = useXoVbdConnectJob(
  () => [vbd],
  () => vm
)

const openConnectModal = useModal({
  component: import('@/modules/vbd/components/modal/VbdConnectModal.vue'),
  props: { count: 1 },
  onConfirm: async () => {
    try {
      await connectVbd()
    } catch (error) {
      console.error('Error when connecting VBD:', error)
    }
  },
})
</script>
