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
import {
  usePoolEnhancedData,
  type PoolDisplayData,
  type PoolFilterableData,
} from '@/modules/pool/composables/use-pool-enhanced-data.composable.ts'
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
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { logicNot } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { servers: rawServers } = defineProps<{
  servers: FrontXoServer[]
}>()

const { t } = useI18n()

const { areServersReady, hasServerFetchError } = useXoServerCollection()

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
      selectItem: r => r(() => (selectedServerId.value = server.id)),
    }
  },
})
</script>

<style scoped lang="postcss">
.pools-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.pools-table {
  gap: 2.4rem;
}

.table-actions,
.container {
  gap: 0.8rem;
}
</style>
