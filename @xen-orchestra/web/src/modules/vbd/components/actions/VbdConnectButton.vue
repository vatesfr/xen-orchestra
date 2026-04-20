<template>
  <UiButton
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canConnectVbd"
    left-icon="status:success-circle"
    :busy="isConnectingVbd"
    @click="openVbdConnectModal()"
  >
    {{ t('action:connect') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useVbdConnectModal } from '@/modules/vbd/composables/use-vbd-connect-modal.composable.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { vbd, vm } = defineProps<{
  vbd?: FrontXoVbd
  vm: FrontXoVm
}>()

const { t } = useI18n()

const {
  openModal: openVbdConnectModal,
  canRun: canConnectVbd,
  isRunning: isConnectingVbd,
} = useVbdConnectModal(
  () => (vbd ? [vbd] : []),
  () => vm
)
</script>
