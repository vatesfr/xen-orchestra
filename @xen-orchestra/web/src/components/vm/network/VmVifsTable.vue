<template>
  <div class="vm-vifs-table">
    <UiTitle>
      {{ t('vifs') }}
      <template #actions>
        <UiLink
          :href="`${xo5Route}#/vms/${vm.id}/network`"
          icon="fa:plus"
          variant="secondary"
          accent="brand"
          size="medium"
        >
          {{ t('add-vifs-in-xo-5') }}
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
import { useXoRoutes } from '@/remote-resources/use-xo-routes.ts'
import { useXoVifCollection } from '@/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useTableState } from '@core/composables/table-state.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useVifColumns } from '@core/tables/column-sets/vif-columns'
import type { XoVm, XoVif } from '@vates/types'
import { logicNot } from '@vueuse/math'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vifs: rawVifs } = defineProps<{
  vm: XoVm
  vifs: XoVif[]
}>()

const { getNetworkById } = useXoNetworkCollection()
const { getVmById } = useXoVmCollection()
const { areVifsReady, hasVifFetchError } = useXoVifCollection()
const { t } = useI18n()

const { routes } = useXoRoutes()
const xo5Route = computed(() => routes.value?.xo5 ?? '/')

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
    const networkName = computed(() => getNetworkName(vif))
    const ipAddresses = computed(() => getIpAddresses(vif))

    return {
      network: r => r({ label: networkName.value }),
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
