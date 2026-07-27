<template>
  <template v-if="server">
    <UiButton
      v-if="server.status === 'connected'"
      v-tooltip="!canDisconnect ? disconnectErrorMessage : undefined"
      left-icon="action:disconnect"
      variant="tertiary"
      accent="danger"
      size="medium"
      :disabled="!canDisconnect"
      :busy="isDisconnecting"
      @click="openDisconnectModal()"
    >
      {{ t('action:disconnect-pool') }}
    </UiButton>
    <UiButton
      v-else
      v-tooltip="!canConnect ? connectErrorMessage : undefined"
      left-icon="action:connect"
      variant="tertiary"
      accent="brand"
      size="medium"
      :disabled="!canConnect"
      :busy="isConnecting"
      @click="handleConnect()"
    >
      {{ t('action:connect-pool') }}
    </UiButton>
  </template>
</template>

<script lang="ts" setup>
import { useServerDisconnectModal } from '@/modules/server/composables/use-server-disconnect-modal.composable.ts'
import { useXoServerConnectJob } from '@/modules/server/jobs/xo-server-connect.job.ts'
import {
  type FrontXoServer,
  useXoServerCollection,
} from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { serverId } = defineProps<{ serverId: FrontXoServer['id'] }>()

const { t } = useI18n()

const { getServerById } = useXoServerCollection()

const server = computed(() => getServerById(serverId))

const serverIdArg = computed(() => serverId)

const {
  isRunning: isConnecting,
  canRun: canConnect,
  errorMessage: connectErrorMessage,
  run: connect,
} = useXoServerConnectJob([serverIdArg])

const {
  openModal: openDisconnectModal,
  canRun: canDisconnect,
  isRunning: isDisconnecting,
  errorMessage: disconnectErrorMessage,
} = useServerDisconnectModal(() => serverId)

async function handleConnect() {
  try {
    await connect()
  } catch (error) {
    console.error('Error when connecting server:', error)
  }
}
</script>
