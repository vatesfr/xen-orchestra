<template>
  <div class="pool-networks-table">
    <UiTitle>
      {{ t('networks') }}
      <template #actions>
        <UiDropdownButton v-tooltip="t('coming-soon')" disabled>
          {{ t('new') }}
        </UiDropdownButton>
      </template>
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
      <VtsTableNew :busy="!areNetworksReady" :error="hasNetworkFetchError" sticky="right" :pagination-bindings>
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
      </VtsTableNew>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/remote-resources/use-xo-pif-collection.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTableNew from '@core/components/table/VtsTableNew.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { icon, objectIcon } from '@core/icons'
import { useNetworkColumns } from '@core/tables/column-sets/network-columns'
import type { XoNetwork } from '@vates/types'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { networks: rawNetworks, internal } = defineProps<{
  networks: XoNetwork[]
  internal?: boolean
}>()

const { t } = useI18n()

const { areNetworksReady, hasNetworkFetchError } = useXoNetworkCollection()

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

const { HeadCells, BodyCells, toggle } = useNetworkColumns({
  body: (network: XoNetwork) => {
    const status = computed(() => getNetworkStatus(network))
    const vlan = computed(() => getNetworkVlan(network))

    return {
      network: r =>
        r({
          label: network.name_label,
          icon: internal ? icon('fa:network-wired') : objectIcon('network', status.value),
        }),
      description: r => r(network.name_description),
      status: r => r(internal ? 'disconnected' : status.value),
      vlan: r => r(internal ? undefined : vlan.value),
      mtu: r => r(network.MTU),
      defaultLockingMode: r => r(getLockingMode(network.defaultIsLocked)),
      selectId: r => r(() => (selectedNetworkId.value = network.id)),
    }
  },
})

// Hide VLAN and Status columns for internal networks
watch(
  () => internal,
  isInternal => {
    toggle('vlan', !isInternal)
    toggle('status', !isInternal)
  },
  { immediate: true }
)
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
