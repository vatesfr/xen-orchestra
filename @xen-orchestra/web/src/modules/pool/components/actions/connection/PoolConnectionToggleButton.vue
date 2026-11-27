<template>
  <template v-if="server">
    <VtsActionButton
      v-if="server.status === 'connected' || server.status === 'connecting'"
      :hint="disconnectServerErrorMessage"
      icon="action:disconnect"
      variant="tertiary"
      accent="danger"
      :disabled="!canDisconnectServer"
      :busy="isDisconnectingServer"
      @click="disconnectServer()"
    >
      {{ t('action:disconnect-pool') }}
    </VtsActionButton>
    <VtsActionButton
      v-else
      :hint="connectServerErrorMessage"
      icon="action:connect"
      variant="tertiary"
      accent="brand"
      :disabled="!canConnectServer"
      :busy="isConnectingServer"
      @click="handleConnect()"
    >
      {{ t('action:connect-pool') }}
    </VtsActionButton>
  </template>
</template>

<script lang="ts" setup>
import { useServerDisconnect } from '@/modules/server/composables/use-server-disconnect.composable.ts'
import { useXoServerConnectJob } from '@/modules/server/jobs/xo-server-connect.job.ts'
import {
  type FrontXoServer,
  useXoServerCollection,
} from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
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
