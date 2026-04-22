<template>
  <div class="vifs-table">
    <UiTitle>
      {{ t('vifs') }}
      <template #action>
        <slot name="title-actions" />
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
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import { useVifConnectModal } from '@/modules/vif/composables/use-vif-connect-modal.composable.ts'
import { useVifDeleteModal } from '@/modules/vif/composables/use-vif-delete-modal.composable.ts'
import { useVifDisconnectModal } from '@/modules/vif/composables/use-vif-disconnect-modal.composable.ts'
import { type FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { CONNECTION_STATUS } from '@/shared/constants.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { icon } from '@core/icons'
import { useVifColumns } from '@core/tables/column-sets/vif-columns.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
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

const { HeadCells, BodyCells } = useVifColumns({
  body: (vif: FrontXoVif) => {
    const ipAddresses = computed(() => getIpAddresses(vif))

    const network = useGetNetworkById(() => vif.$network)

    const poolNetworkRoute = computed(() =>
      network.value ? getPoolNetworkRoute(network.value.$pool, network.value.id) : undefined
    )

    const {
      openModal: openDeleteModal,
      canRun: canDeleteVif,
      isRunning: isDeletingVif,
    } = useVifDeleteModal(() => [vif])

    const {
      openModal: openVifConnectModal,
      canRun: canConnectVif,
      isRunning: isConnectingVif,
      errorMessage: connectErrorMessage,
    } = useVifConnectModal(
      () => [vif],
      () => vm
    )

    const {
      openModal: openVifDisconnectModal,
      canRun: canDisconnectVif,
      isRunning: isDisconnectingVif,
      errorMessage: disconnectErrorMessage,
    } = useVifDisconnectModal(
      () => [vif],
      () => vm
    )

    return {
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
            vif.attached
              ? {
                  label: t('action:disconnect'),
                  hint: !canDisconnectVif.value ? disconnectErrorMessage.value : undefined,
                  icon: 'status:disabled',
                  onClick: () => openVifDisconnectModal(),
                  disabled: !canDisconnectVif.value,
                  busy: isDisconnectingVif.value,
                }
              : {
                  label: t('action:connect'),
                  hint: !canConnectVif.value ? connectErrorMessage.value : undefined,
                  icon: 'status:success-circle',
                  onClick: () => openVifConnectModal(),
                  disabled: !canConnectVif.value,
                  busy: isConnectingVif.value,
                },
            {
              label: t('action:delete'),
              hint: !canDeleteVif.value ? t('vif-connected') : undefined,
              icon: 'action:delete',
              onClick: () => openDeleteModal(),
              disabled: !canDeleteVif.value,
              busy: isDeletingVif.value,
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
