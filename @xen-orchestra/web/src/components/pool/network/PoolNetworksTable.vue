<template>
  <div class="pool-networks-table">
    <UiTitle>
      {{ internal ? t('host-internal-networks') : t('networks') }}
      <template #actions>
        <UiLink :href="xo5NewNetworkHref" icon="fa:plus" size="medium">
          {{ internal ? t('add-host-internal-network-in-xo-5') : t('add-network-in-xo-5') }}
        </UiLink>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="network of paginatedNetworks" :key="network.id" :selected="selectedNetworkId === network.id">
            <BodyCells :item="network" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoPifCollection } from '@/remote-resources/use-xo-pif-collection.ts'
import { useXoRoutes } from '@/remote-resources/use-xo-routes'
import { getNetworkStatus } from '@/utils/xo-records/network.utils'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable'
import { icon, objectIcon } from '@core/icons'
import { useNetworkColumns } from '@core/tables/column-sets/network-columns'
import type { XoNetwork, XoPool } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  networks: rawNetworks,
  pool,
  internal,
  busy,
  error,
} = defineProps<{
  networks: XoNetwork[]
  pool: XoPool
  busy?: boolean
  error?: boolean
  internal?: boolean
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()
const xo5NewNetworkHref = computed(() => buildXo5Route(`/new/network?pool=${pool.id}`))

const { pifs, getPifsByIds } = useXoPifCollection()

const selectedNetworkId = useRouteQuery('id')

const searchQuery = ref('')

const filteredNetworks = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return rawNetworks
  }

  return rawNetworks.filter(network =>
    Object.values(network).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    rawNetworks.length === 0
      ? t('no-network-detected')
      : filteredNetworks.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const getNetworkVlan = (network: XoNetwork) => {
  const networkPIFs = pifs.value.filter(pif => network.PIFs.includes(pif.id))

  if (networkPIFs.length > 0) {
    return networkPIFs[0].vlan !== -1 ? networkPIFs[0].vlan.toString() : t('none')
  }
}

const getLockingMode = (isLocked: boolean) => (isLocked ? t('disabled') : t('unlocked'))

const { pageRecords: paginatedNetworks, paginationBindings } = usePagination('networks', filteredNetworks)

const { HeadCells, BodyCells } = useNetworkColumns({
  exclude: internal ? ['vlan', 'status'] : [],
  body: (network: XoNetwork) => {
    const { buildXo5Route } = useXoRoutes()

    const networkPifs = computed(() => getPifsByIds(network.PIFs))

    const status = computed(() => getNetworkStatus(networkPifs.value))
    const vlan = computed(() => getNetworkVlan(network))
    const defaultLockingMode = computed(() => getLockingMode(network.defaultIsLocked))
    const href = computed(() => buildXo5Route(`/pools/${network.$pool}/network?s=1_0_asc-${network.id}`))

    return {
      network: r =>
        r({
          label: network.name_label,
          icon: internal ? icon('fa:network-wired') : objectIcon('network', status.value),
          href: href.value,
        }),
      description: r => r(network.name_description),
      status: r => r(status.value),
      vlan: r => r(vlan.value),
      mtu: r => r(network.MTU),
      defaultLockingMode: r => r(defaultLockingMode.value),
      selectItem: r => r(() => (selectedNetworkId.value = network.id)),
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
  gap: 2.4rem;
}

.container,
.table-actions {
  gap: 0.8rem;
}
</style>
