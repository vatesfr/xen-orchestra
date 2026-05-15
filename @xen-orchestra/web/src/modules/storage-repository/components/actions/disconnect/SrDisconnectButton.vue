<template>
  <UiButton
    v-tooltip="!canDisconnectSr && disconnectSrErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canDisconnectSr"
    left-icon="action:disconnect"
    :busy="isDisconnectingSr"
    @click="openSrDisconnectModal()"
  >
    {{ t('action:disconnect') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useSrConnectionToggleModal } from '@/modules/storage-repository/composables/use-sr-connection-toggle-modal.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { CONNECTION_ACTION } from '@/shared/constants.ts'
import UiButton from '@xen-orchestra/web-core/components/ui/button/UiButton.vue'
import { vTooltip } from '@xen-orchestra/web-core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { t } = useI18n()

const {
  openModal: openSrDisconnectModal,
  canRun: canDisconnectSr,
  isRunning: isDisconnectingSr,
  errorMessage: disconnectSrErrorMessage,
} = useSrConnectionToggleModal(CONNECTION_ACTION.DISCONNECT, () => [sr])
</script>
