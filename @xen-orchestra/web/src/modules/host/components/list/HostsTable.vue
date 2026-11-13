<template>
  <div class="hosts-table">
    <UiTitle>{{ t('hosts') }}</UiTitle>
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
    <div class="container">
      <VtsTable :pagination-bindings :state sticky="right">
        <thead>
          <HeadCells />
        </thead>
        <tbody>
          <VtsRow v-for="host of paginatedHosts" :key="host.id" :selected="selectedHostId === host.id">
            <BodyCells :item="host" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useHostQueryBuilder } from '@/modules/host/composables/use-host-query-builder.composable.ts'
import { useXoHostOperationLabel } from '@/modules/host/composables/xo-host-operation-label.composable.ts'
import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostIcon } from '@/modules/host/utils/xo-host.util.ts'
import { getPbdsConnectionStatus } from '@/modules/pbd/utils/xo-pbd.util.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { getHostIpAddresses } from '@/modules/pif/utils/xo-pif.util.ts'
import { useGetPbdsInScope } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useStatusLabel } from '@core/composables/status-label.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { icon } from '@core/icons'
import { useHostColumns } from '@core/tables/column-sets/host-columns.ts'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import { compareFirstStrings } from '@core/utils/compare-strings.util.ts'
import { sortByNameDescription } from '@core/utils/sort-by-name-description.util.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { logicAnd, logicNot, logicOr } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  busy,
  hosts: rawHosts,
  error,
  sr,
} = defineProps<{
  hosts: FrontXoHost[]
  busy?: boolean
  error?: boolean
  sr?: FrontXoSr
}>()

const { t } = useI18n()

const selectedHostId = useRouteQuery('id')

const { pifsByHost, arePifsReady, hasPifFetchError } = useXoPifCollection()

const { isMasterHost } = useXoHostCollection()

const { getHostIconTooltip } = useXoHostOperationLabel()

const isReady = logicAnd(() => !busy, arePifsReady)

const hasError = logicOr(() => error, hasPifFetchError)

const { items: filteredHosts, filter, schema } = useHostQueryBuilder('hosts', () => rawHosts)

const state = useTableState({
  busy: logicNot(isReady),
  error: hasError,
  empty: () =>
    rawHosts.length === 0 ? t('no-host-detected') : filteredHosts.value.length === 0 ? { type: 'no-result' } : false,
})

const { getPbdsInScope } = useGetPbdsInScope()

const { compareStatuses } = useStatusLabel()

function getSrConnectionStatus(sr: FrontXoSr, host: FrontXoHost) {
  const scope: SrScope = { type: SR_SCOPE_TYPE.HOST, hostId: host.id }

  return getPbdsConnectionStatus(getPbdsInScope(sr, scope))
}

function getIpAddresses(host: FrontXoHost) {
  return getHostIpAddresses(host.address, pifsByHost.value.get(host.id))
}

function getHostSrConnectionStatus(host: FrontXoHost) {
  return sr === undefined ? CONNECTION_STATUS.DISCONNECTED : getSrConnectionStatus(sr, host)
}

function getMasterIcon(host: FrontXoHost) {
  if (!isMasterHost(host.id)) {
    return undefined
  }

  return {
    icon: icon('status:primary-circle'),
    tooltip: t('master'),
  }
}

const { HeadCells, BodyCells, sortItems } = useHostColumns({
  exclude: sr === undefined ? ['checkbox', 'srStatus'] : ['checkbox'],
  body: (host: FrontXoHost) => {
    const ipAddresses = computed(() => getIpAddresses(host))
    const hostIcon = computed(() => getHostIcon(host))
    const rightIcon = computed(() => getMasterIcon(host))
    const srConnectionStatus = computed(() => getHostSrConnectionStatus(host))

    return {
      host: r =>
        r({
          label: host.name_label,
          to: { name: '/host/[id]/dashboard', params: { id: host.id } },
          icon: hostIcon.value,
          iconTooltip: getHostIconTooltip(host),
          rightIcon: rightIcon.value,
        }),
      description: r => r(host.name_description),
      ipAddresses: r => r(ipAddresses.value),
      tags: r => r(host.tags),
      srStatus: r => r(srConnectionStatus.value),
      selectItem: r => r(() => (selectedHostId.value = host.id)),
    }
  },
  sort: {
    host: sortByNameLabel,
    description: sortByNameDescription,
    ipAddresses: (host1, host2) => compareFirstStrings(getIpAddresses(host1), getIpAddresses(host2)),
    tags: (host1, host2) => compareFirstStrings(host1.tags, host2.tags),
    srStatus: (host1, host2) => compareStatuses(getHostSrConnectionStatus(host1), getHostSrConnectionStatus(host2)),
  },
  initialSort: { id: 'host', direction: 'asc' },
})

const sortedHosts = computed(() => sortItems(filteredHosts.value))

const { pageRecords: paginatedHosts, paginationBindings } = usePagination('hosts', sortedHosts)
</script>

<style lang="postcss" scoped>
.hosts-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .container {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
