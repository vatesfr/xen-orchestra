<template>
  <UiButton
    v-if="server && server.status !== 'connected'"
    left-icon="action:connect"
    variant="secondary"
    accent="brand"
    size="medium"
    :busy="isConnecting"
    @click="connect()"
  >
    {{ t('action:connect-pool') }}
  </UiButton>
  <UiButton
    v-else-if="server && server.status === 'connected'"
    left-icon="action:disconnect"
    variant="secondary"
    accent="brand"
    size="medium"
    :busy="isDisconnecting"
    @click="disconnect()"
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

const { isRunning: isConnecting, run: connect } = useXoServerConnectJob([serverIdArg])

const { isRunning: isDisconnecting, run: disconnect } = useXoServerDisconnectJob([serverIdArg])
</script>

<style lang="postcss" scoped>
.disconnect {
  color: var(--color-danger-item-base);
}
</style>
