<template>
  <div class="host-pif-table">
    <UiTitle>
      {{ t('pifs') }}
      <template #actions>
        <UiLink
          :href="`/#/hosts/${host.id}/network`"
          icon="fa:plus"
          variant="secondary"
          accent="brand"
          size="medium"
          class="button"
        >
          {{ t('scan-pifs-in-xo-5') }}
        </UiLink>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
        <UiTopBottomTable :selected-items="0" :total-items="0">
          <UiTablePagination v-if="arePifsReady" v-bind="paginationBindings" />
        </UiTopBottomTable>
      </div>
      <VtsDataTable
        :is-ready="arePifsReady"
        :has-error="hasPifFetchError"
        :no-data-message="pifs.length === 0 ? t('no-pif-detected') : undefined"
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
            v-for="row of pifsRecords"
            :key="row.id"
            :class="{ selected: selectedPifId === row.id }"
            @click="selectedPifId = row.id"
          >
            <td v-for="column of row.visibleColumns" :key="column.id" class="typo-body-regular-small">
              <div v-if="column.id === 'status'">
                <VtsStatus :status="column.value" />
              </div>
              <div v-else-if="column.id === 'network'" class="network">
                <span v-tooltip class="text-ellipsis">{{ column.value.name }}</span>
                <VtsIcon
                  v-if="column.value.management"
                  v-tooltip="t('management')"
                  name="legacy:primary"
                  size="medium"
                />
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
      <VtsStateHero v-if="searchQuery && filteredPifs.length === 0" format="table" type="no-result" size="small">
        {{ t('no-result') }}
      </VtsStateHero>
      <UiTopBottomTable :selected-items="0" :total-items="0">
        <UiTablePagination v-if="arePifsReady" v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/remote-resources/use-xo-pif-collection.ts'
import type { XoHost } from '@/types/xo/host.type.ts'
import type { XoPif } from '@/types/xo/pif.type.ts'
import { getPifStatus } from '@/utils/xo-records/pif.util.ts'
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

const { pifs } = defineProps<{
  host: XoHost
  pifs: XoPif[]
}>()

const { arePifsReady, hasPifFetchError } = useXoPifCollection()
const { getNetworkById } = useXoNetworkCollection()

const { t } = useI18n()

const selectedPifId = useRouteQuery('id')
const searchQuery = ref('')

const filteredPifs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return pifs
  }

  return pifs.filter(pif => Object.values(pif).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})

const getNetworkName = (pif: XoPif) => getNetworkById(pif.$network)?.name_label ?? ''

const getVlanData = (vlan: number) => (vlan !== -1 ? vlan : t('none'))

const getIpAddresses = (pif: XoPif) => [pif.ip, ...pif.ipv6].filter(ip => ip)

const getIpConfigurationMode = (ipMode: string) => {
  switch (ipMode) {
    case 'Static':
      return t('static')
    case 'DHCP':
      return t('dhcp')
    default:
      return t('none')
  }
}

const { visibleColumns, rows } = useTable('pifs', filteredPifs, {
  rowId: record => record.id,
  columns: define => [
    define(
      'network',
      record => ({
        name: getNetworkName(record),
        management: record.management,
      }),
      { label: t('network') }
    ),
    define('device', { label: t('device') }),
    define('status', record => getPifStatus(record), { label: t('status') }),
    define('vlan', record => getVlanData(record.vlan), { label: t('vlan') }),
    define('ip', record => getIpAddresses(record), { label: t('ip-addresses') }),
    define('mac', { label: t('mac-addresses') }),
    define('mode', record => getIpConfigurationMode(record.mode), {
      label: t('ip-mode'),
    }),
  ],
})

const { pageRecords: pifsRecords, paginationBindings } = usePagination('pifs', rows)

type pifHeader = 'network' | 'device' | 'status' | 'vlan' | 'ip' | 'mac' | 'mode' | 'more'

const headerIcon: Record<pifHeader, IconName> = {
  network: 'fa:align-left',
  device: 'fa:align-left',
  status: 'fa:power-off',
  vlan: 'fa:align-left',
  ip: 'fa:at',
  mac: 'fa:at',
  mode: 'fa:caret-down',
  more: 'fa:ellipsis',
}
</script>

<style scoped lang="postcss">
.host-pif-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.host-pif-table {
  gap: 2.4rem;

  .container,
  .table-actions {
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
