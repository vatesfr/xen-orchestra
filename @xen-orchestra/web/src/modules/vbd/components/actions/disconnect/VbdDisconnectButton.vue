<template>
  <UiButton
    v-tooltip="!canDisconnectVbd && disconnectErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canDisconnectVbd"
    left-icon="status:disabled"
    :busy="isDisconnectingVbd"
    @click="openVbdDisconnectModal()"
  >
    {{ t('action:disconnect') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useVbdConnectionToggleModal } from '@/modules/vbd/composables/use-vbd-connection-toggle-modal.composable.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { CONNECTION_ACTION } from '@/shared/constants.ts'
import UiButton from '@xen-orchestra/web-core/components/ui/button/UiButton.vue'
import { vTooltip } from '@xen-orchestra/web-core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { vbd, vm } = defineProps<{
  vbd: FrontXoVbd
  vm: FrontXoVm
}>()

const { t } = useI18n()

const {
  openModal: openVbdDisconnectModal,
  canRun: canDisconnectVbd,
  isRunning: isDisconnectingVbd,
  errorMessage: disconnectErrorMessage,
} = useVbdConnectionToggleModal(
  CONNECTION_ACTION.DISCONNECT,
  () => [vbd],
  () => vm
)
</script>
