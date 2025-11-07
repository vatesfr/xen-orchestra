<template>
  <div class="vm-vifs-table">
    <UiTitle>
      {{ t('vifs') }}
      <template #actions>
        <UiLink :href="`/#/vms/${vm.id}/network`" icon="fa:plus" variant="secondary" accent="brand" size="medium">
          {{ t('add-vifs-in-xo-5') }}
        </UiLink>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
        <UiTopBottomTable :selected-items="0" :total-items="0">
          <UiTablePagination v-if="areVifsReady" v-bind="paginationBindings" />
        </UiTopBottomTable>
      </div>
      <VtsDataTable
        :is-ready="areVifsReady"
        :has-error="hasVifFetchError"
        :no-data-message="vifs.length === 0 ? t('no-vif-detected') : undefined"
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
            v-for="row of vifsRecords"
            :key="row.id"
            :class="{ selected: selectedVifId === row.id }"
            @click="selectedVifId = row.id"
          >
            <td v-for="column of row.visibleColumns" :key="column.id" class="typo-body-regular-small">
              <div v-if="column.id === 'status'" v-tooltip>
                <VtsStatus :status="column.value" />
              </div>
              <div v-else-if="column.id === 'network'" class="network">
                <span v-tooltip class="text-ellipsis">{{ column.value }}</span>
              </div>
              <div v-else-if="column.id === 'ip'" class="ip-addresses">
                <span class="text-ellipsis">{{ column.value[0] }}</span>
                <span v-if="column.value.length > 1" class="typo-body-regular-small more-ips">
                  {{ `+${column.value.length - 1}` }}
                </span>
              </div>
              <div v-else v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                {{ column.value }}
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <VtsStateHero v-if="searchQuery && filteredVifs.length === 0" format="table" type="no-result" size="small">
        {{ t('no-result') }}
      </VtsStateHero>
      <UiTopBottomTable :selected-items="0" :total-items="0">
        <UiTablePagination v-if="areVifsReady" v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/remote-resources/use-xo-network-collection.ts'
import { useXoVifCollection } from '@/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import type { XoVif } from '@/types/xo/vif.type'
import type { XoVm } from '@/types/xo/vm.type.ts'
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
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useTable } from '@core/composables/table.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vifs } = defineProps<{
  vm: XoVm
  vifs: XoVif[]
}>()

const { getNetworkById } = useXoNetworkCollection()
const { getVmById } = useXoVmCollection()
const { areVifsReady, hasVifFetchError } = useXoVifCollection()
const { t } = useI18n()

const selectedVifId = useRouteQuery('id')

const getNetworkName = (vif: XoVif) => getNetworkById(vif.$network)?.name_label ?? ''

const searchQuery = ref('')

const filteredVifs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return vifs
  }

  return vifs.filter(vif =>
    [...Object.values(vif), getNetworkName(vif)].some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const getIpAddresses = (vif: XoVif) => {
  const addresses = getVmById(vif.$VM)?.addresses

  return addresses ? [...new Set(Object.values(addresses).sort())] : []
}

const { visibleColumns, rows } = useTable('vifs', filteredVifs, {
  rowId: record => record.id,
  columns: define => [
    define('network', record => getNetworkName(record), { label: t('network') }),
    define('device', record => t('vif-device', { device: record.device }), { label: t('device') }),
    define('status', record => (record.attached ? 'connected' : 'disconnected'), { label: t('status') }),
    define('ip', record => getIpAddresses(record), { label: t('ip-addresses') }),
    define('MAC', record => record.MAC, { label: t('mac-addresses') }),
    define('MTU', { label: t('mtu') }),
    define('lockingMode', { label: t('locking-mode') }),
  ],
})

const { pageRecords: vifsRecords, paginationBindings } = usePagination('vifs', rows)

type VifHeader = 'network' | 'device' | 'status' | 'ip' | 'MAC' | 'MTU' | 'lockingMode' | 'more'

const headerIcon: Record<VifHeader, IconName> = {
  network: 'fa:align-left',
  device: 'fa:align-left',
  status: 'fa:power-off',
  ip: 'fa:at',
  MAC: 'fa:at',
  MTU: 'fa:hashtag',
  lockingMode: 'fa:caret-down',
  more: 'fa:ellipsis',
}
</script>

<style scoped lang="postcss">
.vm-vifs-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .table-actions,
  .container {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .network {
    display: flex;
    align-items: center;
    gap: 1.8rem;
  }

  .ip-addresses {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .more-ips {
      color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
