<template>
  <UiButton
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canDisconnectVdd"
    left-icon="status:disabled"
    :busy="isDisconnectingVbd"
    @click="openVbdDisconnectModal()"
  >
    {{ t('action:disconnect') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useVbdDisconnectModal } from '@/modules/vbd/composables/use-vbd-disconnect-modal.composable.ts'
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
  openModal: openVbdDisconnectModal,
  canRun: canDisconnectVdd,
  isRunning: isDisconnectingVbd,
} = useVbdDisconnectModal(
  () => (vbd ? [vbd] : []),
  () => vm
)
</script>
