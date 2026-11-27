<template>
  <div class="pool-networks-table">
    <UiTitle>
      {{ t('networks') }}
      <template #action>
        <slot name="title-actions" />
      </template>
    </UiTitle>
    <div class="container">
      <UiQuerySearchBar v-bind="searchBindings" />
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow
            v-for="network of paginatedNetworks"
            :key="network.uuid"
            :selected="selectedNetworkId === network.uuid"
          >
            <BodyCells :item="network" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types.ts'
import { useNetworkUtils } from '@/modules/network/composables/network-utils.composable.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useSearchFilter } from '@core/composables/search-filter.composable.ts'
import { useStatusLabel } from '@core/composables/status-label.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useNetworkColumns } from '@core/tables/column-sets/network-columns.ts'
import { compareStrings } from '@core/utils/compare-strings.util.ts'
import { sortByNameDescription } from '@core/utils/sort-by-name-description.util.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { networks, busy, error } = defineProps<{
  networks: XenApiNetwork[]
  busy?: boolean
  error?: boolean
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { records: pifs } = usePifStore().subscribe()
const { getNetworkStatus } = useNetworkUtils()

const { t } = useI18n()

const selectedNetworkId = useRouteQuery('id')

const getFirstPifVlan = (network: XenApiNetwork) => pifs.value.find(pif => network.PIFs?.includes(pif.$ref))?.VLAN

const getNetworkVlan = (network: XenApiNetwork) => {
  const vlan = getFirstPifVlan(network)

  if (vlan === undefined) {
    return undefined
  }

  return vlan !== -1 ? vlan.toString() : t('none')
}

// Networks without PIF or without VLAN (-1) come first
const getNetworkVlanNumber = (network: XenApiNetwork) => getFirstPifVlan(network) ?? -1

const getLockingMode = (lockingMode: string) => (lockingMode === 'disabled' ? t('disabled') : t('unlocked'))

const { items: filteredNetworks, searchBindings } = useSearchFilter(() => networks)

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    networks.length === 0
      ? t('no-network-detected')
      : filteredNetworks.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { compareStatuses } = useStatusLabel()

// Computed once per network, so that a sort doesn't scan the PIFs on each comparison
const statusByNetwork = computed(
  () => new Map(filteredNetworks.value.map(network => [network, getNetworkStatus(network)]))
)

const vlanNumberByNetwork = computed(
  () => new Map(filteredNetworks.value.map(network => [network, getNetworkVlanNumber(network)]))
)

const getSortStatus = (network: XenApiNetwork) => statusByNetwork.value.get(network) ?? getNetworkStatus(network)

const getSortVlanNumber = (network: XenApiNetwork) =>
  vlanNumberByNetwork.value.get(network) ?? getNetworkVlanNumber(network)

const { HeadCells, BodyCells, sortItems } = useNetworkColumns({
  id: 'networks',
  exclude: ['actions'],
  body: (network: XenApiNetwork) => {
    const status = computed(() => getNetworkStatus(network))
    const vlan = computed(() => getNetworkVlan(network))
    const defaultLockingMode = computed(() => getLockingMode(network.default_locking_mode))

    return {
      network: r => r({ label: network.name_label }),
      description: r => r(network.name_description),
      status: r => r(status.value),
      vlan: r => r(vlan.value),
      mtu: r => r(network.MTU),
      defaultLockingMode: r => r(defaultLockingMode.value),
      selectItem: r => r(() => (selectedNetworkId.value = network.uuid)),
    }
  },
  sort: {
    network: sortByNameLabel,
    description: sortByNameDescription,
    status: (network1, network2) => compareStatuses(getSortStatus(network1), getSortStatus(network2)),
    vlan: (network1, network2) => getSortVlanNumber(network1) - getSortVlanNumber(network2),
    mtu: (network1, network2) => network1.MTU - network2.MTU,
    defaultLockingMode: (network1, network2) =>
      compareStrings(getLockingMode(network1.default_locking_mode), getLockingMode(network2.default_locking_mode)),
  },
  initialSort: { id: 'network', direction: 'asc' },
})

const sortedNetworks = computed(() => sortItems(filteredNetworks.value))

const { pageRecords: paginatedNetworks, paginationBindings } = usePagination('networks', sortedNetworks)
</script>

<style scoped lang="postcss">
.pool-networks-table,
.container {
  display: flex;
  flex-direction: column;
}

.pool-networks-table {
  gap: 2.4rem;

  .container {
    gap: 0.8rem;
  }
}
</style>
