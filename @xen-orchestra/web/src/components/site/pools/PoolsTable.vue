<template>
  <div class="pools-table">
    <UiTitle>
      {{ t('pools') }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTableActions :title="t('table-actions')">
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            left-icon="fa:square-caret-down"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ t('change-state') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            left-icon="fa:edit"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ t('edit') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            left-icon="fa:eraser"
            variant="tertiary"
            accent="danger"
            size="medium"
          >
            {{ t('forget') }}
          </UiButton>
        </UiTableActions>
      </div>
      <VtsTable
        :ready="areServersReady"
        :error="hasServerFetchError"
        :empty="emptyMessage"
        :pagination-bindings
        sticky="right"
      >
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
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import { useXoServerCollection } from '@/remote-resources/use-xo-server-collection.ts'
import { getHostInfo } from '@/utils/xo-records/host.util'
import { getPoolInfo } from '@/utils/xo-records/pool.util'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useServerColumns } from '@core/tables/column-sets/server-columns'
import type { XoServer } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getHostInfo } from './get-host-info'
import { getPoolInfo } from './get-pool-info'

const { servers: rawServers } = defineProps<{
  servers: XoServer[]
}>()

const { t } = useI18n()

const { areServersReady, hasServerFetchError } = useXoServerCollection()

const { getHostById } = useXoHostCollection()

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

const emptyMessage = computed(() => {
  if (rawServers.length === 0) {
    return t('no-server-detected')
  }

  if (filteredServers.value.length === 0) {
    return t('no-results')
  }

  return undefined
})

const { pageRecords: paginatedServers, paginationBindings } = usePagination('pools', filteredServers)

const { HeadCells, BodyCells } = useServerColumns({
  body: (server: XoServer) => {
    const poolInfo = computed(() => getPoolInfo(server))
    const host = computed(() => getHostById(server.master))
    const hostInfo = computed(() => getHostInfo(host.value))

    return {
      pool: r => r(poolInfo.value),
      hostIp: r => r(server.host),
      status: r => r(server.error ? 'unable-to-connect-to-the-pool' : server.status),
      primaryHost: r => r(hostInfo.value),
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
