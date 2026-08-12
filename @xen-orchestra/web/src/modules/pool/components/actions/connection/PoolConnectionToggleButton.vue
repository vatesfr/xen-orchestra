<template>
  <template v-if="server">
    <UiButton
      v-if="server.status === 'connected'"
      v-tooltip="!canDisconnectServer ? disconnectServerErrorMessage : undefined"
      left-icon="action:disconnect"
      variant="tertiary"
      accent="danger"
      size="medium"
      :disabled="!canDisconnectServer"
      :busy="isDisconnectingServer"
      @click="disconnectServer()"
    >
      {{ t('action:disconnect-pool') }}
    </UiButton>
    <UiButton
      v-else
      v-tooltip="!canConnectServer ? connectServerErrorMessage : undefined"
      left-icon="action:connect"
      variant="tertiary"
      accent="brand"
      size="medium"
      :disabled="!canConnectServer"
      :busy="isConnectingServer"
      @click="handleConnect()"
    >
      {{ t('action:connect-pool') }}
    </UiButton>
  </template>
</template>

<script lang="ts" setup>
import { useServerDisconnect } from '@/modules/server/composables/use-server-disconnect.composable.ts'
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
  run: connectServer,
  canRun: canConnectServer,
  isRunning: isConnectingServer,
  errorMessage: connectServerErrorMessage,
} = useXoServerConnectJob([serverIdArg])

const { disconnectServer, canDisconnectServer, isDisconnectingServer, disconnectServerErrorMessage } =
  useServerDisconnect(() => serverId)

async function handleConnect() {
  try {
    await connectServer()
  } catch (error) {
    console.error('Error when connecting server:', error)
  }
}
</script>
