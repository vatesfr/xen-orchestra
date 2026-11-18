<template>
  <VtsActionButton
    :hint="connection.errorMessage"
    variant="tertiary"
    accent="brand"
    :disabled="!connection.canToggle"
    :icon="connection.icon"
    :busy="connection.isToggling"
    @click="connection.toggle()"
  >
    {{ connection.label }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useVifConnection } from '@/modules/vif/composables/use-vif-connection.composable.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useMapper } from '@core/packages/mapper'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
import { useI18n } from 'vue-i18n'

const { vif, vm } = defineProps<{
  vif: FrontXoVif
  vm: FrontXoVm
}>()

const { t } = useI18n()

const {
  connectVifs,
  disconnectVifs,
  canConnectVifs,
  canDisconnectVifs,
  isConnectingVifs,
  isDisconnectingVifs,
  connectVifsErrorMessage,
  disconnectVifsErrorMessage,
} = useVifConnection({
  vifs: () => [vif],
  vm: () => vm,
})

const connection = useMapper(
  () => (vif.attached ? CONNECTION_ACTION.DISCONNECT : CONNECTION_ACTION.CONNECT),
  () => ({
    connect: {
      label: t('action:connect'),
      icon: 'action:connect' as const,
      toggle: connectVifs,
      canToggle: canConnectVifs.value,
      isToggling: isConnectingVifs.value,
      errorMessage: connectVifsErrorMessage.value,
    },
    disconnect: {
      label: t('action:disconnect'),
      icon: 'action:disconnect' as const,
      toggle: disconnectVifs,
      canToggle: canDisconnectVifs.value,
      isToggling: isDisconnectingVifs.value,
      errorMessage: disconnectVifsErrorMessage.value,
    },
  }),
  'connect'
)
</script>
