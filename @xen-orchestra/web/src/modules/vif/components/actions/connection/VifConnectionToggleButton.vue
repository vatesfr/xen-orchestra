<template>
  <UiButton
    v-tooltip="!canToggleVifConnection && toggleConnectionErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canToggleVifConnection"
    :left-icon="connection.icon"
    :busy="isTogglingVifConnection"
    @click="openVifConnectionToggleModal()"
  >
    {{ connection.label }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useVifConnectionToggleModal } from '@/modules/vif/composables/use-vif-connection-toggle-modal.composable.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useMapper } from '@core/packages/mapper'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vif, vm } = defineProps<{
  vif: FrontXoVif
  vm: FrontXoVm
}>()

const { t } = useI18n()

const action = computed(() => (vif.attached ? CONNECTION_ACTION.DISCONNECT : CONNECTION_ACTION.CONNECT))

const connection = useMapper(
  () => action.value,
  () => ({
    connect: { label: t('action:connect'), icon: 'action:connect' },
    disconnect: { label: t('action:disconnect'), icon: 'action:disconnect' },
  }),
  'connect'
)

const {
  openModal: openVifConnectionToggleModal,
  canRun: canToggleVifConnection,
  isRunning: isTogglingVifConnection,
  errorMessage: toggleConnectionErrorMessage,
} = useVifConnectionToggleModal(
  action,
  () => [vif],
  () => vm
)
</script>
