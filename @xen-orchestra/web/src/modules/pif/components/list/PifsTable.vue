<template>
  <div class="pifs-table">
    <UiTitle>
      {{ t('pifs') }}
      <template #action>
        <slot name="title-actions" />
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
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getPoolNetworkLink } from '@/modules/network/utils/xo-network.util.ts'
import { useXoPifCollection, type FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { getPifStatus } from '@/modules/pif/utils/xo-pif.util.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { icon } from '@core/icons'
import { usePifColumns } from '@core/tables/column-sets/pif-columns.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import type { IP_CONFIGURATION_MODE } from '@vates/types'
import { logicNot } from '@vueuse/math'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { pifs: rawPifs } = defineProps<{
  pifs: FrontXoPif[]
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { arePifsReady, hasPifFetchError } = useXoPifCollection()
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

const getIpAddresses = (pif: FrontXoPif) => [pif.ip, ...pif.ipv6].filter(ip => ip)

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

function getManagementIcon(pif: FrontXoPif) {
  if (!pif.management) {
    return undefined
  }

  return {
    icon: icon('status:primary-circle'),
    tooltip: t('management'),
  }
}

const { HeadCells, BodyCells } = usePifColumns({
  body: (pif: FrontXoPif) => {
    const status = computed(() => getPifStatus(pif))
    const vlan = computed(() => getVlanData(pif.vlan))
    const ip = computed(() => getIpAddresses(pif))
    const mode = computed(() => getIpConfigurationMode(pif.mode))
    const rightIcon = computed(() => getManagementIcon(pif))

    const network = useGetNetworkById(() => pif.$network)
    const poolNetworkLink = computed(() => getPoolNetworkLink(network.value))

    return {
      network: r =>
        network.value
          ? r({
              label: network.value.name_label,
              to: poolNetworkLink.value,
              icon: 'object:network',
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
.pifs-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.pifs-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
