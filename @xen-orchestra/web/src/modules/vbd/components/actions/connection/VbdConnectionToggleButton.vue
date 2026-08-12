<template>
  <MenuItem :icon="connection.icon" :disabled="!connection.canRun" :busy="connection.isRunning" @click="connection.onClick()">
    {{ connection.label }}
    <i v-if="!connection.canRun && connection.errorMessage">{{ connection.errorMessage }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVbdConnection } from '@/modules/vbd/composables/use-vbd-connection.composable.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useMapper } from '@core/packages/mapper'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vbd, vm } = defineProps<{
  vbd: FrontXoVbd
  vm: FrontXoVm
}>()

const { t } = useI18n()

const action = computed(() => (vbd.attached ? CONNECTION_ACTION.DISCONNECT : CONNECTION_ACTION.CONNECT))

const {
  connectVbds,
  disconnectVbds,
  canConnectVbds,
  canDisconnectVbds,
  isConnectingVbds,
  isDisconnectingVbds,
  connectVbdsErrorMessage,
  disconnectVbdsErrorMessage,
} = useVbdConnection({
  vbds: () => [vbd],
  vm: () => vm,
})

const connection = useMapper(
  () => action.value,
  () => ({
    connect: {
      label: t('action:connect'),
      icon: 'action:connect',
      onClick: connectVbds,
      canRun: canConnectVbds.value,
      isRunning: isConnectingVbds.value,
      errorMessage: connectVbdsErrorMessage.value,
    },
    disconnect: {
      label: t('action:disconnect'),
      icon: 'action:disconnect',
      onClick: disconnectVbds,
      canRun: canDisconnectVbds.value,
      isRunning: isDisconnectingVbds.value,
      errorMessage: disconnectVbdsErrorMessage.value,
    },
  }),
  'connect'
)
</script>
