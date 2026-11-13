<template>
  <div class="networks-table">
    <UiTitle>
      {{ internal ? t('host-internal-networks') : t('networks') }}
      <template #action>
        <slot name="title-actions" />
      </template>
    </UiTitle>
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
    <div class="container">
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
import { useNetworkDelete } from '@/modules/network/composables/use-network-delete.composable.ts'
import { useXoNetworkUtils } from '@/modules/network/composables/xo-network-utils.composable.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getNetworkRoute, getNetworkStatus } from '@/modules/network/utils/xo-network.util.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useStatusLabel } from '@core/composables/status-label.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { icon } from '@core/icons'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useNetworkColumns } from '@core/tables/column-sets/network-columns.ts'
import { compareStrings } from '@core/utils/compare-strings.util.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { sortByNameDescription } from '@core/utils/sort-by-name-description.util.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  networks: rawNetworks,
  internal,
  busy,
  error,
} = defineProps<{
  networks: FrontXoNetwork[]
  busy?: boolean
  error?: boolean
  internal?: boolean
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { t } = useI18n()

const { getPifsByIds, getPifsByNetworkId } = useXoPifCollection()

const selectedNetworkId = useRouteQuery('id')

const { items: filteredNetworks, filter } = useQueryBuilderFilter(internal ? 'inw' : 'nw', () => rawNetworks)

const schema = useQueryBuilderSchema<FrontXoNetwork>({
  '': useStringSchema(t('any-property')),
  name_label: useStringSchema(t('name')),
  name_description: useStringSchema(t('description')),
  MTU: useNumberSchema(t('mtu')),
  defaultIsLocked: useBooleanSchema(t('default-locking-mode'), {
    true: t('locked'),
    false: t('unlocked'),
  }),
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

// Networks without PIF or without VLAN (-1) come first
const getNetworkVlanNumber = (network: FrontXoNetwork) => getPifsByNetworkId(network.id)[0]?.vlan ?? -1

const getLockingMode = (isLocked: boolean) => (isLocked ? t('disabled') : t('unlocked'))

const { compareStatuses } = useStatusLabel()

const getStatus = (network: FrontXoNetwork) => getNetworkStatus(getPifsByIds(network.PIFs))

const { HeadCells, BodyCells, sortItems } = useNetworkColumns({
  exclude: internal ? ['vlan', 'status', 'selectItem'] : ['selectItem'],
  body: (network: FrontXoNetwork) => {
    const status = computed(() => getStatus(network))
    const { networkVlan, networkDefaultLockingMode } = useXoNetworkUtils(network)

    const { deleteNetworks, isDeletingNetworks } = useNetworkDelete(() => [network])

    return {
      network: r =>
        r({
          label: network.name_label,
          icon: icon('object:network'),
          to: getNetworkRoute(network.id),
        }),
      description: r => r(network.name_description),
      status: r => r(status.value),
      vlan: r => r(networkVlan.value),
      mtu: r => r(network.MTU),
      defaultLockingMode: r => r(networkDefaultLockingMode.value),
      actions: r =>
        r({
          onClick: () => (selectedNetworkId.value = network.id),
          actions: [
            {
              label: t('action:delete'),
              icon: 'action:delete',
              onClick: () => deleteNetworks(),
              busy: isDeletingNetworks.value,
              accent: 'danger',
            },
          ],
        }),
    }
  },
  sort: {
    network: sortByNameLabel,
    description: sortByNameDescription,
    status: (network1, network2) => compareStatuses(getStatus(network1), getStatus(network2)),
    vlan: (network1, network2) => getNetworkVlanNumber(network1) - getNetworkVlanNumber(network2),
    mtu: (network1, network2) => network1.MTU - network2.MTU,
    defaultLockingMode: (network1, network2) =>
      compareStrings(getLockingMode(network1.defaultIsLocked), getLockingMode(network2.defaultIsLocked)),
  },
  initialSort: { id: 'network', direction: 'asc' },
})

const sortedNetworks = computed(() => sortItems(filteredNetworks.value))

const { pageRecords: paginatedNetworks, paginationBindings } = usePagination('networks', sortedNetworks)
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
