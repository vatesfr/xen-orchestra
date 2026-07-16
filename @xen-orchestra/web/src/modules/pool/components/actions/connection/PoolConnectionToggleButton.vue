<template>
  <UiButton
    v-if="server && server.status !== 'connected'"
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
  <UiButton
    v-else-if="server && server.status === 'connected'"
    v-tooltip="!canDisconnect ? disconnectErrorMessage : undefined"
    left-icon="action:disconnect"
    variant="tertiary"
    accent="brand"
    size="medium"
    :disabled="!canDisconnect"
    :busy="isDisconnecting"
    @click="handleDisconnect()"
  >
    {{ t('action:disconnect-pool') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useXoServerConnectJob } from '@/modules/server/jobs/xo-server-connect.job.ts'
import { useXoServerDisconnectJob } from '@/modules/server/jobs/xo-server-disconnect.job.ts'
import { useXoServerCollection } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ serverId: FrontXoServer['id'] }>()

const { t } = useI18n()

const { servers } = useXoServerCollection()

const server = computed(() => servers.value.find(s => s.id === props.serverId))

const serverIdArg = computed(() => props.serverId)

const {
  isRunning: isConnecting,
  canRun: canConnect,
  errorMessage: connectErrorMessage,
  run: connect,
} = useXoServerConnectJob([serverIdArg])

const {
  isRunning: isDisconnecting,
  canRun: canDisconnect,
  errorMessage: disconnectErrorMessage,
  run: disconnect,
} = useXoServerDisconnectJob([serverIdArg])

async function handleConnect() {
  try {
    await connect()
  } catch (error) {
    console.error('Error when connecting server:', error)
  }
}

async function handleDisconnect() {
  try {
    await disconnect()
  } catch (error) {
    console.error('Error when disconnecting server:', error)
  }
}
</script>

<style lang="postcss" scoped>
.disconnect {
  color: var(--color-danger-item-base);
}
</style>
