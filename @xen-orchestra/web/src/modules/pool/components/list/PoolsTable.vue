<template>
  <div class="pools-table">
    <UiTitle>
      {{ t('pools') }}
    </UiTitle>
    <VtsQueryBuilder v-model="filter" :schema />
    <div class="container">
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="server of paginatedServers" :key="server.id" :selected="selectedServerId === server.id">
            <BodyCells :item="server" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import {
  usePoolEnhancedData,
  type PoolDisplayData,
  type PoolFilterableData,
} from '@/modules/pool/composables/use-pool-enhanced-data.composable.ts'
import { useServerDisconnectModal } from '@/modules/server/composables/use-xo-server-disconnect-modal.composable.ts'
import { useXoServerConnectJob } from '@/modules/server/jobs/xo-server-connect.job.ts'
import {
  useXoServerCollection,
  type FrontXoServer,
} from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useServerColumns } from '@core/tables/column-sets/server-columns.ts'
import { downloadBugTools } from '@core/utils/download-bugtools.utils.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { logicNot } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { servers: rawServers } = defineProps<{
  servers: FrontXoServer[]
}>()

const { t } = useI18n()

const { areServersReady, hasServerFetchError } = useXoServerCollection()

const { getMasterHostByPoolId, areHostsFetching, areHostsReady, hasHostFetchError } = useXoHostCollection()

const selectedServerId = useRouteQuery('id')

const { filterableServers, getDisplayData } = usePoolEnhancedData(() => rawServers)

const { items: filteredServers, filter } = useQueryBuilderFilter<PoolFilterableData>(
  'servers',
  () => filterableServers.value
)

const schema = useQueryBuilderSchema<PoolFilterableData>({
  '': useStringSchema(t('any-property')),
  poolName: useStringSchema(t('name')),
  masterHostIp: useStringSchema(t('ip-address')),
  poolStatus: useStringSchema(t('status'), {
    connected: t('connected'),
    connecting: t('connecting'),
    disconnected: t('disconnected'),
    'unable-to-connect-to-the-pool': t('unable-to-connect-to-the-pool'),
  }),
  primaryHostName: useStringSchema(t('master')),
})

const state = useTableState({
  busy: logicNot(areServersReady),
  error: hasServerFetchError,
  empty: () =>
    rawServers.length === 0
      ? t('no-server-detected')
      : filteredServers.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const displayServers = computed(() => filteredServers.value.map(server => getDisplayData(server)))

const { pageRecords: paginatedServers, paginationBindings } = usePagination('servers', displayServers)

const { HeadCells, BodyCells } = useServerColumns({
  body: (server: PoolDisplayData) => {
    const poolInfo = computed(() => ({
      label: server.poolName,
      to: server.poolId
        ? {
            name: '/pool/[id]/dashboard',
            params: { id: server.poolId },
          }
        : undefined,
      icon: server.poolIcon,
    }))

    const serverIdArg = computed(() => server.id)
    const { isRunning: isConnecting, run: connect } = useXoServerConnectJob([serverIdArg])
    const { openModal: openDisconnectModal, isRunning: isDisconnecting } = useServerDisconnectModal(() => server.id)
    const downloadHost = computed(() => (server.poolId ? getMasterHostByPoolId(server.poolId) : undefined))

    return {
      pool: r => r(poolInfo.value),
      hostIp: r => r(server.masterHostIp),
      status: r => r(server.poolStatus),
      primaryHost: r =>
        r({
          label: server.primaryHostName,
          to: server.master ? `/host/${server.master}/dashboard` : undefined,
          icon: server.primaryHostIcon,
          rightIcon: server.primaryHostRightIcon
            ? {
                icon: server.primaryHostRightIcon,
                tooltip: t('master'),
              }
            : undefined,
        }),
      actions: r =>
        r({
          onClick: () => (selectedServerId.value = server.id),
          actions: [
            server.status === 'connected'
              ? {
                  label: t('action:disconnect-pool'),
                  icon: 'action:disconnect',
                  busy: isDisconnecting.value,
                  onClick: () => openDisconnectModal(),
                }
              : {
                  label: t('action:connect-pool'),
                  icon: 'action:connect',
                  busy: isConnecting.value,
                  onClick: () => connect(),
                },
            {
              label: t('action:download-bugtools-archive'),
              icon: 'action:download',
              busy: areHostsFetching.value,
              disabled: (areHostsReady.value && downloadHost.value === undefined) || hasHostFetchError.value,
              onClick: () => {
                const address = downloadHost.value?.address
                if (address !== undefined) {
                  downloadBugTools(address)
                }
              },
            },
          ],
        }),
    }
  },
})
</script>

<style scoped lang="postcss">
.pools-table,
.container {
  display: flex;
  flex-direction: column;
}

.pools-table {
  gap: 2.4rem;
}

.container {
  gap: 0.8rem;
}
</style>
