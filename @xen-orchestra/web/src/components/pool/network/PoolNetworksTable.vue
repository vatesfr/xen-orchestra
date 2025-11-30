<template>
  <div class="pool-networks-table">
    <UiTitle>
      {{ internal ? t('host-internal-networks') : t('networks') }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTableActions :title="t('table-actions')">
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            left-icon="fa:edit"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ t('edit') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            left-icon="fa:copy"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ t('copy-info-json') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            left-icon="fa:trash"
            variant="tertiary"
            accent="danger"
            size="medium"
          >
            {{ t('delete') }}
          </UiButton>
        </UiTableActions>
      </div>
      <VtsTable :busy :error :empty="emptyMessage" sticky="right" :pagination-bindings>
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
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { icon, objectIcon } from '@core/icons'
import { useNetworkColumns } from '@core/tables/column-sets/network-columns'
import type { XoNetwork } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { networks: rawNetworks, internal } = defineProps<{
  networks: XoNetwork[]
  busy?: boolean
  error?: boolean
  internal?: boolean
}>()

const { t } = useI18n()

const { pifs } = useXoPifCollection()

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

const emptyMessage = computed(() => {
  if (rawNetworks.length === 0) {
    return t('no-network-detected')
  }

  if (filteredNetworks.value.length === 0) {
    return t('no-results')
  }

  return undefined
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

const getLockingMode = (isLocked: boolean) => (isLocked ? t('disabled') : t('unlocked'))

const { pageRecords: paginatedNetworks, paginationBindings } = usePagination('networks', filteredNetworks)

const { HeadCells, BodyCells } = useNetworkColumns({
  exclude: internal ? ['vlan', 'status'] : [],
  body: (network: XoNetwork) => {
    const { buildXo5Route } = useXoRoutes()

    const status = computed(() => getNetworkStatus(network))
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
      defaultLockingMode: r => r(defaultLockingMode),
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
