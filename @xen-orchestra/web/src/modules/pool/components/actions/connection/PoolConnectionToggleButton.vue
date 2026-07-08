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
    accent="danger"
    size="medium"
    :busy="isDisconnecting"
    @click="disconnect()"
  >
    {{ t('action:disconnect-pool') }}
  </UiButton>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoServerConnectJob } from '@/modules/server/jobs/xo-server-connect.job.ts'
import { useXoServerDisconnectJob } from '@/modules/server/jobs/xo-server-disconnect.job.ts'
import { useXoServerCollection } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolId } = defineProps<{ poolId: FrontXoPool['id'] }>()

const { t } = useI18n()

const { serverByPool } = useXoServerCollection()

const server = computed(() => serverByPool.value.get(poolId)?.[0])

const serverId = computed(() => server.value?.id ?? ('' as FrontXoServer['id']))

const { isRunning: isConnecting, run: connect } = useXoServerConnectJob([serverId])

const { isRunning: isDisconnecting, run: disconnect } = useXoServerDisconnectJob([serverId])
</script>

<style lang="postcss" scoped>
.disconnect {
  color: var(--color-danger-item-base);
}
</style>
