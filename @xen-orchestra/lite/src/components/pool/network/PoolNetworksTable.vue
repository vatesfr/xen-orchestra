<template>
  <div class="pool-networks-table">
    <UiTitle>
      {{ t('networks') }}
      <template #action>
        <slot name="title-actions" />
      </template>
    </UiTitle>
    <div class="container">
      <VtsQueryBuilder v-model="filter" :schema />
      <VtsTable :state :pagination-bindings sticky="right">
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

<script lang="ts" setup>
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types.ts'
import {
  type NetworkFilterableData,
  useNetworkQueryBuilder,
} from '@/modules/network/composables/use-network-query-builder.composable.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useNetworkColumns } from '@core/tables/column-sets/network-columns.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { networks, busy, error } = defineProps<{
  networks: XenApiNetwork[]
  busy?: boolean
  error?: boolean
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { t } = useI18n()

const selectedNetworkId = useRouteQuery('id')

const getVlanLabel = (vlan: number | undefined) => {
  if (vlan === undefined) {
    return undefined
  }

  return vlan !== -1 ? vlan.toString() : t('none')
}

const getLockingMode = (lockingMode: string) => (lockingMode === 'disabled' ? t('disabled') : t('unlocked'))

const { items: filteredNetworks, filter, schema } = useNetworkQueryBuilder('nw', () => networks)

const { pageRecords: paginatedNetworks, paginationBindings } = usePagination('networks', filteredNetworks)

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    networks.length === 0
      ? t('no-network-detected')
      : filteredNetworks.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { HeadCells, BodyCells } = useNetworkColumns({
  exclude: ['actions'],
  body: (network: NetworkFilterableData) => {
    const vlan = computed(() => getVlanLabel(network.vlan))
    const defaultLockingMode = computed(() => getLockingMode(network.default_locking_mode))

    return {
      network: r => r({ label: network.name_label }),
      description: r => r(network.name_description),
      status: r => r(network.status),
      vlan: r => r(vlan.value),
      mtu: r => r(network.MTU),
      defaultLockingMode: r => r(defaultLockingMode.value),
      selectItem: r => r(() => (selectedNetworkId.value = network.uuid)),
    }
  },
})
</script>

<style scoped lang="postcss">
.pool-networks-table,
.container {
  display: flex;
  flex-direction: column;
}

.pool-networks-table {
  gap: 2.4rem;

  .container {
    gap: 0.8rem;
  }
}
</style>
