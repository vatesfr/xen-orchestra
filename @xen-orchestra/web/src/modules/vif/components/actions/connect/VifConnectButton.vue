<template>
  <UiButton
    v-tooltip="!canConnectVif && connectErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canConnectVif"
    left-icon="action:connect"
    :busy="isConnectingVif"
    @click="openVifConnectModal()"
  >
    {{ t('action:connect') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useVifConnectionToggleModal } from '@/modules/vif/composables/use-vif-connection-toggle-modal.composable.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { CONNECTION_ACTION } from '@core/types/connection.type.ts'
import { useI18n } from 'vue-i18n'

const { vif, vm } = defineProps<{
  vif: FrontXoVif
  vm: FrontXoVm
}>()

const { t } = useI18n()

const {
  openModal: openVifConnectModal,
  canRun: canConnectVif,
  isRunning: isConnectingVif,
  errorMessage: connectErrorMessage,
} = useVifConnectionToggleModal(
  CONNECTION_ACTION.CONNECT,
  () => [vif],
  () => vm
)
</script>
