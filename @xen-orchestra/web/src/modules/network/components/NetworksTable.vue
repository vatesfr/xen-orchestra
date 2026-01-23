<template>
  <div class="networks-table">
    <UiTitle>
      {{ internal ? t('host-internal-networks') : t('networks') }}
      <template #action>
        <slot name="title-actions" />
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
import { getNetworkStatus } from '@/modules/network/utils/xo-network.util.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { icon, objectIcon } from '@core/icons'
import { useNetworkColumns } from '@core/tables/column-sets/network-columns.ts'
import type { XoNetwork } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  networks: rawNetworks,
  internal,
  busy,
  error,
} = defineProps<{
  networks: XoNetwork[]
  busy?: boolean
  error?: boolean
  internal?: boolean
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { t } = useI18n()

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
          icon: internal
            ? icon('object:network')
            : objectIcon('network', status.value === 'partially-connected' ? 'warning' : status.value),
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
.networks-table,
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
