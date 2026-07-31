<template>
  <UiButton
    v-tooltip="!connection.canToggle && connection.errorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!connection.canToggle"
    :left-icon="connection.icon"
    :busy="connection.isToggling"
    @click="connection.toggle()"
  >
    {{ connection.label }}
  </UiButton>
</template>

<script lang="ts" setup>
import type { XenApiVif, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useVifConnection } from '@/modules/vif/composables/use-vif-connection.composable.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useMapper } from '@core/packages/mapper'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
import { useI18n } from 'vue-i18n'

const { vif, vm } = defineProps<{
  vif: XenApiVif
  vm: XenApiVm
}>()

const { t } = useI18n()

const {
  connectVif,
  disconnectVif,
  canConnectVif,
  canDisconnectVif,
  isConnectingVif,
  isDisconnectingVif,
  connectVifErrorMessage,
  disconnectVifErrorMessage,
} = useVifConnection({
  vifs: () => [vif],
  vm: () => vm,
})

const connection = useMapper(
  () => (vif.currently_attached ? CONNECTION_ACTION.DISCONNECT : CONNECTION_ACTION.CONNECT),
  () => ({
    connect: {
      label: t('action:connect'),
      icon: 'action:connect' as const,
      toggle: connectVif,
      canToggle: canConnectVif.value,
      isToggling: isConnectingVif.value,
      errorMessage: connectVifErrorMessage.value,
    },
    disconnect: {
      label: t('action:disconnect'),
      icon: 'action:disconnect' as const,
      toggle: disconnectVif,
      canToggle: canDisconnectVif.value,
      isToggling: isDisconnectingVif.value,
      errorMessage: disconnectVifErrorMessage.value,
    },
  }),
  'connect'
)
</script>
