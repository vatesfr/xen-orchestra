<template>
  <div class="vifs-table">
    <UiTitle>
      {{ t('vifs') }}
      <template #action>
        <slot name="title-actions" />
      </template>
    </UiTitle>
    <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
    <VtsTable :state :pagination-bindings sticky="right">
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="vif of paginatedVifs" :key="vif.uuid" :selected="selectedVifId === vif.uuid">
          <BodyCells :item="vif" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import type { XenApiNetwork, XenApiVif, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/network.util.ts'
import { useVifConnection } from '@/modules/vif/composables/use-vif-connection.composable.ts'
import { useVifEdit } from '@/modules/vif/composables/use-vif-edit.composable.ts'
import { getVifRoute } from '@/modules/vif/utils/vif.util.ts'
import { useNetworkStore } from '@/stores/xen-api/network.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import { useVifStore } from '@/stores/xen-api/vif.store.ts'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { icon } from '@core/icons'
import { useMapper } from '@core/packages/mapper'
import { type ActionItem } from '@core/tables/column-definitions/action-column.ts'
import { useVifNetworkColumns } from '@core/tables/column-sets/vif-network-columns.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
import { getUniqueIpAddressesForDevice } from '@core/utils/ip-address.utils.ts'
import { useVifLockingModeLabel } from '@core/utils/vif.util.ts'
import { logicNot } from '@vueuse/math'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vifs, vm } = defineProps<{
  vifs: XenApiVif[]
  vm: XenApiVm
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { isReady, hasError } = useVifStore().subscribe()
const { getByOpaqueRef: getNetworkByOpaqueRef } = useNetworkStore().subscribe()
const { getByOpaqueRef: getGuestMetricsByOpaqueRef } = useVmGuestMetricsStore().subscribe()
const { pool } = usePoolStore().subscribe()

const { t } = useI18n()

const { goToVifEdit } = useVifEdit()

const selectedVifId = useRouteQuery('id')

const getNetworkName = (networkRef: XenApiNetwork['$ref']) => getNetworkByOpaqueRef(networkRef)?.name_label ?? ''

const getIpAddresses = (vif: XenApiVif) => {
  const networks = getGuestMetricsByOpaqueRef(vm.guest_metrics)?.networks

  return getUniqueIpAddressesForDevice(networks, vif.device)
}

const searchQuery = ref('')

const filteredVifs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return vifs
  }

  return vifs.filter(vif =>
    [...Object.values(vif), getNetworkName(vif.network)].some(value =>
      String(value).toLocaleLowerCase().includes(searchTerm)
    )
  )
})

const state = useTableState({
  busy: logicNot(isReady),
  error: hasError,
  empty: () =>
    vifs.length === 0 ? t('no-vif-detected') : filteredVifs.value.length === 0 ? { type: 'no-result' } : false,
})

const { pageRecords: paginatedVifs, paginationBindings } = usePagination('vifs', filteredVifs)

const { HeadCells, BodyCells } = useVifNetworkColumns({
  body: (vif: XenApiVif) => {
    const network = computed(() => getNetworkByOpaqueRef(vif.network))

    const poolNetworkRoute = computed(() =>
      pool.value && network.value ? getPoolNetworkRoute(pool.value.uuid, network.value.uuid) : undefined
    )

    const ipAddresses = computed(() => getIpAddresses(vif))

    const lockingModeLabel = useVifLockingModeLabel(() => vif.locking_mode)

    const {
      connectVifs,
      disconnectVifs,
      canConnectVifs,
      canDisconnectVifs,
      isConnectingVifs,
      isDisconnectingVifs,
      connectVifsErrorMessage,
      disconnectVifsErrorMessage,
    } = useVifConnection({
      vifs: () => [vif],
      vm: () => vm,
    })

    const connectionAction = useMapper(
      () => (vif.currently_attached ? CONNECTION_ACTION.DISCONNECT : CONNECTION_ACTION.CONNECT),
      () => ({
        connect: {
          label: t('action:connect'),
          icon: 'action:connect',
          onClick: () => connectVifs(),
          disabled: !canConnectVifs.value,
          busy: isConnectingVifs.value,
          hint: canConnectVifs.value ? undefined : connectVifsErrorMessage.value,
        } satisfies ActionItem,
        disconnect: {
          label: t('action:disconnect'),
          icon: 'action:disconnect',
          onClick: () => disconnectVifs(),
          disabled: !canDisconnectVifs.value,
          busy: isDisconnectingVifs.value,
          hint: canDisconnectVifs.value ? undefined : disconnectVifsErrorMessage.value,
        } satisfies ActionItem,
      }),
      'connect'
    )

    return {
      vif: r =>
        r({
          label: t('vif'),
          to: getVifRoute(vif.uuid),
          icon: icon('object:vif'),
        }),
      network: r =>
        network.value
          ? r({
              label: network.value.name_label,
              to: poolNetworkRoute.value,
              icon: icon('object:network'),
            })
          : renderBodyCell(),
      device: r => r(t('vif-device', { device: vif.device })),
      status: r => r(vif.currently_attached ? 'connected' : 'disconnected'),
      ipsAddresses: r => r(ipAddresses.value),
      macAddresses: r => r(vif.MAC),
      mtu: r => r(vif.MTU),
      lockingMode: r => r(lockingModeLabel.value),
      actions: r =>
        r({
          onClick: () => (selectedVifId.value = vif.uuid),
          actions: [
            { label: t('action:edit'), icon: 'action:edit', onClick: () => goToVifEdit(vif) } satisfies ActionItem,
            connectionAction.value,
          ],
        }),
    }
  },
})
</script>

<style scoped lang="postcss">
.vifs-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
