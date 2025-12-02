<template>
  <div class="pool-host-internal-networks-table">
    <UiTitle>
      {{ t('host-internal-networks') }}
      <template #actions>
        <UiButton
          v-tooltip="t('coming-soon')"
          disabled
          left-icon="fa:plus"
          variant="secondary"
          accent="brand"
          size="medium"
        >
          {{ t('new') }}
        </UiButton>
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
            left-icon="fa:trash"
            variant="tertiary"
            accent="danger"
            size="medium"
          >
            {{ t('delete') }}
          </UiButton>
        </UiTableActions>
      </div>
      <VtsTable :busy="!isReady" :error="hasError" :empty="emptyMessage" :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow
            v-for="network of paginatedNetworks"
            :key="network.uuid"
            :selected="selectedNetworkId === network.uuid"
          >
            <BodyCells :item="network" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useNetworkColumns } from '@core/tables/column-sets/network-columns.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { networks } = defineProps<{
  networks: XenApiNetwork[]
}>()

const { isReady, hasError } = useNetworkStore().subscribe()

const { t } = useI18n()

const selectedNetworkId = useRouteQuery('id')

const getLockingMode = (lockingMode: string) => (lockingMode === 'disabled' ? t('disabled') : t('unlocked'))

const searchQuery = ref('')

const filteredNetworks = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return networks
  }

  return networks.filter(network =>
    Object.values(network).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const { pageRecords: paginatedNetworks, paginationBindings } = usePagination('internal-networks', filteredNetworks)

const emptyMessage = computed(() => {
  if (networks.length === 0) {
    return t('no-network-detected')
  }

  if (filteredNetworks.value.length === 0) {
    return t('no-result')
  }

  return undefined
})

const { HeadCells, BodyCells } = useNetworkColumns({
  exclude: ['status', 'vlan'],
  body: (network: XenApiNetwork) => ({
    network: r => r({ label: network.name_label }),
    description: r => r(network.name_description),
    mtu: r => r(network.MTU),
    defaultLockingMode: r => r(getLockingMode(network.default_locking_mode)),
    selectItem: r => r(() => selectedNetworkId.value === network.uuid),
  }),
})
</script>

<style scoped lang="postcss">
.pool-host-internal-networks-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
