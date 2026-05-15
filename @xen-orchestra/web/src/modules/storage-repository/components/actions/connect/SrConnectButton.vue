<template>
  <UiButton
    v-tooltip="!canConnectSr && connectSrErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canConnectSr"
    left-icon="action:connect"
    :busy="isConnectingSr"
    @click="openSrConnectModal()"
  >
    {{ t('action:connect') }}
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
  openModal: openSrConnectModal,
  canRun: canConnectSr,
  isRunning: isConnectingSr,
  errorMessage: connectSrErrorMessage,
} = useSrConnectionToggleModal(CONNECTION_ACTION.CONNECT, () => [sr])
</script>
