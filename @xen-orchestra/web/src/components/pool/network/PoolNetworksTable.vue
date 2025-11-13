<template>
  <div class="pool-networks-table">
    <UiTitle>
      {{ t('networks') }}
      <template #actions>
        <UiLink
          :href="`/#/new/network?pool=${pool.id}`"
          icon="fa:plus"
          variant="secondary"
          accent="brand"
          size="medium"
        >
          {{ t('add-network-in-xo-5') }}
        </UiLink>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTopBottomTable :selected-items="0" :total-items="0">
          <UiTablePagination v-if="areNetworksReady" v-bind="paginationBindings" />
        </UiTopBottomTable>
      </div>
      <VtsDataTable
        :is-ready="areNetworksReady"
        :has-error="hasNetworkFetchError"
        :no-data-message="networks.length === 0 ? t('no-network-detected') : undefined"
      >
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th>
                <div v-tooltip class="text-ellipsis">
                  <VtsIcon :name="headerIcon[column.id]" size="medium" />
                  {{ column.label }}
                </div>
              </th>
            </template>
          </tr>
        </template>
        <template #tbody>
          <tr
            v-for="row of networksRecords"
            :key="row.id"
            :class="{ selected: selectedNetworkId === row.id }"
            @click="selectedNetworkId = row.id"
          >
            <td v-for="column of row.visibleColumns" :key="column.id" class="typo-body-regular-small">
              <VtsStatus v-if="column.id === 'status'" :status="column.value" />
              <div v-else v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                {{ column.value }}
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <VtsStateHero v-if="searchQuery && filteredNetworks.length === 0" format="table" type="no-result" size="small">
        <div>{{ t('no-result') }}</div>
      </VtsStateHero>
      <UiTopBottomTable :selected-items="0" :total-items="0">
        <UiTablePagination v-if="areNetworksReady" v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/remote-resources/use-xo-pif-collection.ts'
import type { XoNetwork } from '@/types/xo/network.type.ts'
import type { XoPool } from '@/types/xo/pool.type.ts'
import type { IconName } from '@core/icons'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTable } from '@core/composables/table.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { networks } = defineProps<{
  pool: XoPool
  networks: XoNetwork[]
}>()

const { t } = useI18n()

const { areNetworksReady, hasNetworkFetchError } = useXoNetworkCollection()

const { pifs } = useXoPifCollection()

const selectedNetworkId = useRouteQuery('id')

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

const getNetworkVlan = (network: XoNetwork) => {
  const networkPIFs = pifs.value.filter(pif => network.PIFs.includes(pif.id))

  if (networkPIFs.length > 0) {
    return networkPIFs[0].vlan !== -1 ? networkPIFs[0].vlan.toString() : t('none')
  }
}

const getNetworkStatus = (network: XoNetwork) => {
  const networkPIFs = pifs.value.filter(pif => network.PIFs?.includes(pif.id))

  if (networkPIFs.length === 0) {
    return 'disconnected'
  }

  const isConnected = networkPIFs.map(pif => pif.attached && pif.carrier)
  if (isConnected.every(Boolean)) {
    return 'connected'
  }

  if (isConnected.some(Boolean)) {
    return 'partially-connected'
  }
  return 'disconnected'
}

const getLockingMode = (lockingMode: string) => (lockingMode === 'disabled' ? t('disabled') : t('unlocked'))

const { visibleColumns, rows } = useTable('networks', filteredNetworks, {
  rowId: record => record.id,
  columns: define => [
    define('name_label', { label: t('name') }),
    define('name_description', {
      label: t('description'),
    }),
    define('status', record => getNetworkStatus(record), { label: t('pifs-status') }),
    define('vlan', record => getNetworkVlan(record), { label: t('vlan') }),
    define('MTU', { label: t('mtu') }),
    define('default_locking_mode', record => getLockingMode(record.default_locking_mode), {
      label: t('default-locking-mode'),
    }),
  ],
})

const { pageRecords: networksRecords, paginationBindings } = usePagination('networks', rows)

type NetworkHeader = 'name_label' | 'name_description' | 'status' | 'vlan' | 'MTU' | 'default_locking_mode'

const headerIcon: Record<NetworkHeader, IconName> = {
  name_label: 'fa:align-left',
  name_description: 'fa:align-left',
  status: 'fa:power-off',
  vlan: 'fa:align-left',
  MTU: 'fa:hashtag',
  default_locking_mode: 'fa:caret-down',
}
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
