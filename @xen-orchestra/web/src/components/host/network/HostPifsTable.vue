<template>
  <div class="host-pifs-table">
    <UiTitle>
      {{ t('pifs') }}
      <template #action>
        <UiLink :href="xo5ScanPifsHref" icon="fa:plus" size="medium">
          {{ t('scan-pifs-in-xo-5') }}
        </UiLink>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
      </div>

      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="pif of paginatedPifs" :key="pif.id" :selected="selectedPifId === pif.id">
            <BodyCells :item="pif" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/remote-resources/use-xo-pif-collection.ts'
import { useXoRoutes } from '@/remote-resources/use-xo-routes'
import { getNetworkStatus, getPoolNetworkLink } from '@/utils/xo-records/network.utils'
import { getPifStatus } from '@/utils/xo-records/pif.util.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable'
import { icon, objectIcon } from '@core/icons'
import { usePifColumns } from '@core/tables/column-sets/pif-columns'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell'
import type { IP_CONFIGURATION_MODE, XoHost, XoPif } from '@vates/types'
import { logicNot } from '@vueuse/math'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { pifs: rawPifs, host } = defineProps<{
  pifs: XoPif[]
  host: XoHost
}>()

const { buildXo5Route } = useXoRoutes()
const xo5ScanPifsHref = computed(() => buildXo5Route(`/hosts/${host.id}/network`))

const { arePifsReady, hasPifFetchError, getPifsByIds } = useXoPifCollection()
const { useGetNetworkById } = useXoNetworkCollection()

const { t } = useI18n()

const selectedPifId = useRouteQuery('id')
const searchQuery = ref('')

const filteredPifs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return rawPifs
  }

  return rawPifs.filter(pif => Object.values(pif).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})

const state = useTableState({
  busy: logicNot(arePifsReady),
  error: hasPifFetchError,
  empty: () =>
    rawPifs.length === 0 ? t('no-pif-detected') : filteredPifs.value.length === 0 ? { type: 'no-result' } : false,
})

const getVlanData = (vlan: number) => (vlan !== -1 ? vlan : t('none'))

const getIpAddresses = (pif: XoPif) => [pif.ip, ...pif.ipv6].filter(ip => ip)

const getIpConfigurationMode = (ipMode: IP_CONFIGURATION_MODE) => {
  switch (ipMode) {
    case 'Static':
      return t('static')
    case 'DHCP':
      return t('dhcp')
    default:
      return t('none')
  }
}

const { pageRecords: paginatedPifs, paginationBindings } = usePagination('pifs', filteredPifs)

function getManagementIcon(pif: XoPif) {
  if (!pif.management) {
    return undefined
  }

  return {
    icon: icon('legacy:primary'),
    tooltip: t('management'),
  }
}

const { HeadCells, BodyCells } = usePifColumns({
  body: (pif: XoPif) => {
    const status = computed(() => getPifStatus(pif))
    const vlan = computed(() => getVlanData(pif.vlan))
    const ip = computed(() => getIpAddresses(pif))
    const mode = computed(() => getIpConfigurationMode(pif.mode))
    const rightIcon = computed(() => getManagementIcon(pif))

    const network = useGetNetworkById(() => pif.$network)
    const poolNetworkLink = computed(() => getPoolNetworkLink(network.value))
    const networkPifs = computed(() => getPifsByIds(network.value?.PIFs ?? []))
    const networkStatus = computed(() => getNetworkStatus(networkPifs.value))

    return {
      network: r =>
        network.value
          ? r({
              label: network.value.name_label,
              to: poolNetworkLink.value,
              icon: objectIcon('network', networkStatus.value),
            })
          : renderBodyCell(),
      device: r => r(pif.device, { rightIcon: rightIcon.value }),
      status: r => r(status.value),
      vlan: r => r(vlan.value),
      ip: r => r(ip.value),
      mac: r => r(pif.mac),
      mode: r => r(mode.value),
      selectItem: r => r(() => (selectedPifId.value = pif.id)),
    }
  },
})
</script>

<style scoped lang="postcss">
.host-pifs-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.host-pifs-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
