<template>
  <div class="pool-networks-table">
    <UiTitle>
      {{ t('networks') }}
      <template #actions>
        <UiDropdownButton v-tooltip="t('coming-soon!')" disabled>
          {{ t('new') }}
        </UiDropdownButton>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTableActions :title="t('table-actions')">
          <UiButton
            v-tooltip="t('coming-soon!')"
            disabled
            left-icon="fa:edit"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ t('action:edit') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon!')"
            disabled
            left-icon="fa:copy"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ t('action:copy-info-json') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon!')"
            disabled
            left-icon="fa:trash"
            variant="tertiary"
            accent="danger"
            size="medium"
          >
            {{ t('action:delete') }}
          </UiButton>
        </UiTableActions>
      </div>
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
import { useTableState } from '@core/composables/table-state.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useNetworkColumns } from '@core/tables/column-sets/network-columns'
import { logicNot } from '@vueuse/math'
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

const state = useTableState({
  busy: logicNot(isReady),
  error: hasError,
  empty: () =>
    networks.length === 0
      ? t('no-network-detected')
      : filteredNetworks.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { HeadCells, BodyCells } = useNetworkColumns({
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
}
</style>
