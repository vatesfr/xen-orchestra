<template>
  <div class="vm-vifs-table">
    <UiTitle>
      {{ t('vifs') }}
      <template #actions>
        <UiLink :href="xo5VmVifHref" icon="fa:plus" size="medium">
          {{ t('action:add-vifs-in-xo-5') }}
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
          <VtsRow v-for="vif of paginatedVifs" :key="vif.id" :selected="selectedVifId === vif.id">
            <BodyCells :item="vif" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/remote-resources/use-xo-pif-collection'
import { useXoRoutes } from '@/remote-resources/use-xo-routes.ts'
import { useXoVifCollection } from '@/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import { getNetworkStatus, getPoolNetworkLink } from '@/utils/xo-records/network.utils'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useTableState } from '@core/composables/table-state.composable'
import { objectIcon } from '@core/icons'
import { useVifColumns } from '@core/tables/column-sets/vif-columns'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell'
import type { XoVm, XoVif } from '@vates/types'
import { logicNot } from '@vueuse/math'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vifs: rawVifs, vm } = defineProps<{
  vm: XoVm
  vifs: XoVif[]
}>()

const { getNetworkById, useGetNetworkById } = useXoNetworkCollection()
const { getVmById } = useXoVmCollection()
const { areVifsReady, hasVifFetchError } = useXoVifCollection()
const { getPifsByIds } = useXoPifCollection()
const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()
const xo5VmVifHref = computed(() => buildXo5Route(`/vms/${vm.id}/network`))

const selectedVifId = useRouteQuery('id')

const getNetworkName = (vif: XoVif) => getNetworkById(vif.$network)?.name_label ?? ''

const searchQuery = ref('')

const filteredVifs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return rawVifs
  }

  return rawVifs.filter(vif =>
    [...Object.values(vif), getNetworkName(vif)].some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const state = useTableState({
  busy: logicNot(areVifsReady),
  error: hasVifFetchError,
  empty: () =>
    rawVifs.length === 0 ? t('no-vif-detected') : filteredVifs.value.length === 0 ? { type: 'no-result' } : false,
})

const getIpAddresses = (vif: XoVif) => {
  const addresses = getVmById(vif.$VM)?.addresses

  return addresses ? [...new Set(Object.values(addresses).sort())] : []
}

const { pageRecords: paginatedVifs, paginationBindings } = usePagination('vifs', filteredVifs)

const { HeadCells, BodyCells } = useVifColumns({
  body: (vif: XoVif) => {
    const ipAddresses = computed(() => getIpAddresses(vif))

    const network = useGetNetworkById(() => vif.$network)
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
      device: r => r(t('vif-device', { device: vif.device })),
      status: r => r(vif.attached ? 'connected' : 'disconnected'),
      ipsAddresses: r => r(ipAddresses.value),
      macAddresses: r => r(vif.MAC),
      mtu: r => r(vif.MTU),
      lockingMode: r => r(vif.lockingMode),
      selectItem: r => r(() => (selectedVifId.value = vif.id)),
    }
  },
})
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
}
</style>
