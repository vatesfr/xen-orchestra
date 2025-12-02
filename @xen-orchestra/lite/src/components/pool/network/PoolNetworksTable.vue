<template>
  <div class="pool-networks-table">
    <UiTitle>
      {{ t('networks') }}
      <template #actions>
        <UiDropdownButton v-tooltip="t('coming-soon')" disabled>
          {{ t('new') }}
        </UiDropdownButton>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTableActions :title="t('table-actions')">
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
            left-icon="fa:copy"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ t('copy-info-json') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            left-icon="fa:trash"
            variant="tertiary"
            accent="danger"
            size="medium"
          >
            {{ t('delete') }}
          </UiButton>
        </UiTableActions>
      </div>
      <VtsTable :busy="!isReady" :error="hasError" :empty="emptyMessage" :pagination-bindings sticky="right">
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

<script setup lang="ts">
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { usePifMetricsStore } from '@/stores/xen-api/pif-metrics.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useNetworkColumns } from '@core/tables/column-sets/network-columns'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { networks } = defineProps<{
  networks: XenApiNetwork[]
}>()

const { isReady, hasError } = useNetworkStore().subscribe()
const { records: pifs } = usePifStore().subscribe()
const { getPifCarrier } = usePifMetricsStore().subscribe()

const { t } = useI18n()

const selectedNetworkId = useRouteQuery('id')

const getNetworkVlan = (network: XenApiNetwork) => {
  const networkPIFs = pifs.value.filter(pif => network.PIFs?.includes(pif.$ref))

  if (networkPIFs.length > 0) {
    return networkPIFs[0].VLAN !== -1 ? networkPIFs[0].VLAN.toString() : t('none')
  }
}

const getNetworkStatus = (network: XenApiNetwork) => {
  const networkPIFs = pifs.value.filter(pif => network.PIFs?.includes(pif.$ref))

  if (networkPIFs.length === 0) {
    return 'disconnected'
  }

  const isConnected = networkPIFs.map(pif => pif.currently_attached && getPifCarrier(pif))
  if (isConnected.every(Boolean)) {
    return 'connected'
  }

  if (isConnected.some(Boolean)) {
    return 'partially-connected'
  }

  return 'disconnected'
}

const getLockingMode = (lockingMode: string) => (lockingMode === 'disabled' ? t('disabled') : t('unlocked'))

const searchQuery = ref('')

const filteredNetworks = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return networks
  }

  return networks.filter(network =>
    Object.values(network).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const { pageRecords: paginatedNetworks, paginationBindings } = usePagination('networks', filteredNetworks)

const emptyMessage = computed(() => {
  if (networks.length === 0) {
    return t('no-network-detected')
  }

  if (filteredNetworks.value.length === 0) {
    return t('no-result')
  }

  return undefined
})

const { HeadCells, BodyCells } = useNetworkColumns({
  body: (network: XenApiNetwork) => ({
    network: r => r({ label: network.name_label }),
    description: r => r(network.name_description),
    status: r => r(getNetworkStatus(network)),
    vlan: r => r(getNetworkVlan(network)),
    mtu: r => r(network.MTU),
    defaultLockingMode: r => r(getLockingMode(network.default_locking_mode)),
    selectItem: r => r(() => (selectedNetworkId.value = network.uuid)),
  }),
})
</script>

<style scoped lang="postcss">
.pool-networks-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.pool-networks-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }

  .checkbox,
  .more {
    width: 4.8rem;
  }

  .checkbox {
    text-align: center;
    line-height: 1;
  }
}
</style>
