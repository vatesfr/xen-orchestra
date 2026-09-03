<template>
  <div class="vifs-table">
    <UiTitle>
      {{ t('vifs') }}
      <template #action>
        <slot name="title-actions" />
      </template>
    </UiTitle>
    <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
    <div class="container">
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
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import { useVifConnection } from '@/modules/vif/composables/use-vif-connection.composable.ts'
import { useVifDelete } from '@/modules/vif/composables/use-vif-delete.composable.ts'
import { type FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { getVifTrafficRoute } from '@/modules/vif/utils/xo-vif.util.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
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
import { CONNECTION_ACTION, CONNECTION_STATUS } from '@core/types/connection.ts'
import { getUniqueIpAddressesForDevice } from '@core/utils/ip-address.utils.ts'
import { logicNot } from '@vueuse/math'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vifs: rawVifs, vm } = defineProps<{
  vifs: FrontXoVif[]
  vm: FrontXoVm
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { getNetworkById, useGetNetworkById } = useXoNetworkCollection()
const { getVmById } = useXoVmCollection()
const { areVifsReady, hasVifFetchError } = useXoVifCollection()
const { t } = useI18n()

const selectedVifId = useRouteQuery('id')

const getNetworkName = (vif: FrontXoVif) => getNetworkById(vif.$network)?.name_label ?? ''

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

const getIpAddresses = (vif: FrontXoVif) => {
  const addresses = getVmById(vif.$VM)?.addresses

  return getUniqueIpAddressesForDevice(addresses, vif.device)
}

const { pageRecords: paginatedVifs, paginationBindings } = usePagination('vifs', filteredVifs)

const { HeadCells, BodyCells } = useVifNetworkColumns({
  body: (vif: FrontXoVif) => {
    const ipAddresses = computed(() => getIpAddresses(vif))

    const network = useGetNetworkById(() => vif.$network)

    const poolNetworkRoute = computed(() =>
      network.value ? getPoolNetworkRoute(network.value.$pool, network.value.id) : undefined
    )

    const { deleteVifs, canDeleteVifs, isDeletingVifs } = useVifDelete(() => [vif])

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
      () => (vif.attached ? CONNECTION_ACTION.DISCONNECT : CONNECTION_ACTION.CONNECT),
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
          to: getVifTrafficRoute(vif.id),
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
      status: r => r(vif.attached ? CONNECTION_STATUS.CONNECTED : CONNECTION_STATUS.DISCONNECTED),
      ipsAddresses: r => r(ipAddresses.value),
      macAddresses: r => r(vif.MAC),
      mtu: r => r(vif.MTU),
      lockingMode: r => r(vif.lockingMode),
      actions: r =>
        r({
          onClick: () => (selectedVifId.value = vif.id),
          actions: [
            connectionAction.value,
            {
              label: t('action:delete'),
              hint: !canDeleteVifs.value ? t('vif-connected') : undefined,
              icon: 'action:delete',
              onClick: () => deleteVifs(),
              disabled: !canDeleteVifs.value,
              busy: isDeletingVifs.value,
              accent: 'danger',
            },
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

  .table-actions,
  .container {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
