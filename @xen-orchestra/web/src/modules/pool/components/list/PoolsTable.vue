<template>
  <div class="pools-table">
    <UiTitle>
      {{ t('pools') }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>
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
import { useXoHostCollection, type FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getPoolInfo } from '@/modules/pool/utils/xo-pool.util.ts'
import {
  useXoServerCollection,
  type FrontXoServer,
} from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { icon, objectIcon } from '@core/icons'
import { useServerColumns } from '@core/tables/column-sets/server-columns.ts'
import { logicNot } from '@vueuse/math'
import { toLower } from 'lodash-es'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { servers: rawServers } = defineProps<{
  servers: FrontXoServer[]
}>()

const { t } = useI18n()

const { areServersReady, hasServerFetchError } = useXoServerCollection()

const { getHostById, isMasterHost } = useXoHostCollection()

const selectedServerId = useRouteQuery('id')

const searchQuery = ref('')

const filteredServers = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return rawServers
  }

  return rawServers.filter(server =>
    Object.values(server).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
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

const { pageRecords: paginatedServers, paginationBindings } = usePagination('pools', filteredServers)

function getMasterIcon(host: FrontXoHost) {
  if (!isMasterHost(host.id)) {
    return undefined
  }

  return {
    icon: icon('status:primary-circle'),
    tooltip: t('master'),
  }
}

const { HeadCells, BodyCells } = useServerColumns({
  body: (server: FrontXoServer) => {
    const poolInfo = computed(() => getPoolInfo(server))
    const host = computed(() => getHostById(server.master))

    const hostIcon = computed(() => (host.value ? objectIcon('host', toLower(host.value.power_state)) : undefined))
    const rightIcon = computed(() => (host.value ? getMasterIcon(host.value) : undefined))

    return {
      pool: r => r(poolInfo.value),
      hostIp: r => r(server.host),
      status: r => r(server.error ? 'unable-to-connect-to-the-pool' : server.status),
      primaryHost: r =>
        r({
          label: host.value?.name_label ?? '',
          to: `/host/${host.value?.id}/dashboard`,
          icon: hostIcon.value,
          rightIcon: rightIcon.value,
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
