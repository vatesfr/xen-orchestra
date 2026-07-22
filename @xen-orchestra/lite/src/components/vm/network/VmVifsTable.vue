<template>
  <div class="vm-vifs-table">
    <UiTitle>
      {{ t('vifs') }}
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
          <VtsRow v-for="vif of paginatedVifs" :key="vif.uuid" :selected="selectedVifId === vif.uuid">
            <BodyCells :item="vif" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { XenApiNetwork, XenApiVif, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useVifConnectionToggleModal } from '@/modules/vif/composables/use-vif-connection-toggle-modal.composable.ts'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { useVifStore } from '@/stores/xen-api/vif.store'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useTableState } from '@core/composables/table-state.composable'
import { useVifColumns } from '@core/tables/column-sets/vif-columns'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
import { getUniqueIpAddressesForDevice } from '@core/utils/ip-address.utils.ts'
import { logicNot } from '@vueuse/math'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vifs, vm } = defineProps<{
  vifs: XenApiVif[]
  vm: XenApiVm
}>()

const { isReady, hasError } = useVifStore().subscribe()
const { getByOpaqueRef: getNetworkByOpaqueRef } = useNetworkStore().subscribe()
const { getByOpaqueRef: getGuestMetricsByOpaqueRef } = useVmGuestMetricsStore().subscribe()

const { t } = useI18n()

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

const { HeadCells, BodyCells } = useVifColumns({
  body: (vif: XenApiVif) => {
    const name = computed(() => getNetworkName(vif.network))
    const ipAddresses = computed(() => getIpAddresses(vif))

    const {
      openModal: openVifConnectionToggleModal,
      canRun: canToggleVifConnection,
      isRunning: isTogglingVifConnection,
      errorMessage: toggleConnectionErrorMessage,
    } = useVifConnectionToggleModal(
      () => (vif.currently_attached ? CONNECTION_ACTION.DISCONNECT : CONNECTION_ACTION.CONNECT),
      () => [vif],
      () => vm
    )

    return {
      network: r => r({ label: name.value }),
      device: r => r(t('vif-device', { device: vif.device })),
      status: r => r(vif.currently_attached ? 'connected' : 'disconnected'),
      ipsAddresses: r => r(ipAddresses.value),
      macAddresses: r => r(vif.MAC),
      mtu: r => r(vif.MTU),
      lockingMode: r => r(vif.locking_mode),
      actions: r =>
        r({
          onClick: () => (selectedVifId.value = vif.uuid),
          actions: [
            {
              label: vif.currently_attached ? t('action:disconnect') : t('action:connect'),
              hint: !canToggleVifConnection.value ? toggleConnectionErrorMessage.value : undefined,
              icon: vif.currently_attached ? 'action:disconnect' : 'action:connect',
              onClick: () => openVifConnectionToggleModal(),
              disabled: !canToggleVifConnection.value,
              busy: isTogglingVifConnection.value,
            },
          ],
        }),
    }
  },
})
</script>

<style scoped lang="postcss">
.vm-vifs-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .container,
  .table-actions {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
