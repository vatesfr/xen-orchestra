<template>
  <UiButton
    v-if="server && server.status !== 'connected'"
    left-icon="action:connect"
    variant="secondary"
    accent="brand"
    size="medium"
    :busy="isRunning"
    @click="connect()"
  >
    {{ t('action:connect') }}
  </UiButton>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoServerConnectJob } from '@/modules/server/jobs/xo-server-connect.job.ts'
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

const { isRunning, run: connect } = useXoServerConnectJob([serverId])
</script>
