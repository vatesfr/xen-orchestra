<template>
  <MenuItem
    :icon="connection.icon"
    :disabled="!canToggleVbdConnection"
    :busy="isTogglingVbdConnection"
    @click="openVbdConnectionToggleModal()"
  >
    {{ connection.label }}
    <i v-if="!canToggleVbdConnection && toggleConnectionErrorMessage">{{ toggleConnectionErrorMessage }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVbdConnectionToggleModal } from '@/modules/vbd/composables/use-vbd-connection-toggle-modal.composable.ts'
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

const connection = useMapper(
  () => action.value,
  () => ({
    connect: { label: t('action:connect'), icon: 'action:connect' },
    disconnect: { label: t('action:disconnect'), icon: 'action:disconnect' },
  }),
  'connect'
)

const {
  openModal: openVbdConnectionToggleModal,
  canRun: canToggleVbdConnection,
  isRunning: isTogglingVbdConnection,
  errorMessage: toggleConnectionErrorMessage,
} = useVbdConnectionToggleModal(
  action,
  () => [vbd],
  () => vm
)
</script>
