<template>
  <div class="pool-host-internal-networks-table">
    <UiTitle>
      {{ t('host-internal-networks') }}
      <template #actions>
        <UiLink
          :href="`/#/new/network?pool=${pool.id}`"
          icon="fa:plus"
          variant="secondary"
          accent="brand"
          size="medium"
        >
          {{ t('add-host-internal-network-in-xo-5') }}
        </UiLink>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTopBottomTable :selected-items="0" :total-items="0" @toggle-select-all="toggleSelect">
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
              <div v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                {{ column.value }}
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <VtsStateHero v-if="searchQuery && filteredNetworks.length === 0" format="table" type="no-result" size="small">
        <div>{{ t('no-result') }}</div>
      </VtsStateHero>
      <UiTopBottomTable :selected-items="0" :total-items="0" @toggle-select-all="toggleSelect">
        <UiTablePagination v-if="areNetworksReady" v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/remote-resources/use-xo-network-collection.ts'
import type { XoNetwork } from '@/types/xo/network.type.ts'
import type { XoPool } from '@/types/xo/pool.type.ts'
import type { IconName } from '@core/icons'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import useMultiSelect from '@core/composables/table/multi-select.composable.ts'
import { useTable } from '@core/composables/table.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { networks } = defineProps<{
  pool: XoPool
  networks: XoNetwork[]
}>()

const { areNetworksReady, hasNetworkFetchError } = useXoNetworkCollection()

const { t } = useI18n()

const searchQuery = ref('')
const selectedNetworkId = useRouteQuery('id')

const filteredNetworks = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return networks
  }

  return networks.filter(network =>
    Object.values(network).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const networkIds = computed(() => networks.map(network => network.id))

const { selected } = useMultiSelect(networkIds)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? networkIds.value : []
}

const getLockingMode = (lockingMode: string) => (lockingMode === 'disabled' ? t('disabled') : t('unlocked'))

const { visibleColumns, rows } = useTable('networks', filteredNetworks, {
  rowId: record => record.id,
  columns: define => [
    define('name_label', { label: t('name') }),
    define('name_description', { label: t('description') }),
    define('MTU', { label: t('mtu') }),
    define('default_locking_mode', record => getLockingMode(record.default_locking_mode), {
      label: t('default-locking-mode'),
    }),
  ],
})

const { pageRecords: networksRecords, paginationBindings } = usePagination('internal-networks', rows)

type NetworkHeader = 'name_label' | 'name_description' | 'MTU' | 'default_locking_mode'

const headerIcon: Record<NetworkHeader, IconName> = {
  name_label: 'fa:align-left',
  name_description: 'fa:align-left',
  MTU: 'fa:hashtag',
  default_locking_mode: 'fa:caret-down',
}
</script>

<style scoped lang="postcss">
.pool-host-internal-networks-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.pool-host-internal-networks-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
