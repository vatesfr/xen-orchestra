<template>
  <div class="vm-vifs-table">
    <UiTitle>
      {{ t('vifs') }}
      <template #actions>
        <UiButton
          v-tooltip="t('coming-soon')"
          disabled
          left-icon="fa:plus"
          variant="secondary"
          accent="brand"
          size="medium"
        >
          {{ t('new-vif') }}
        </UiButton>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
        <UiTableActions :title="t('table-actions')">
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            left-icon="fa:power-off"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ t('change-state') }}
          </UiButton>
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
          <VtsRow v-for="vif of paginatedVifs" :key="vif.uuid" :selected="selectedVifId === vif.uuid">
            <BodyCells :item="vif" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { XenApiNetwork, XenApiVif } from '@/libs/xen-api/xen-api.types'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { useVifStore } from '@/stores/xen-api/vif.store'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useVifColumns } from '@core/tables/column-sets/vif-columns'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vifs } = defineProps<{
  vifs: XenApiVif[]
}>()

const { isReady, hasError } = useVifStore().subscribe()
const { getByOpaqueRef: getNetworkByOpaqueRef } = useNetworkStore().subscribe()
const { getByOpaqueRef: getGuestMetricsByOpaqueRef } = useVmGuestMetricsStore().subscribe()
const { getByOpaqueRef: getVmByOpaqueRef } = useVmStore().subscribe()

const { t } = useI18n()

const selectedVifId = useRouteQuery('id')

const getNetworkName = (networkRef: XenApiNetwork['$ref']) => getNetworkByOpaqueRef(networkRef)?.name_label ?? ''

const getIpAddresses = (vif: XenApiVif) => {
  const vm = getVmByOpaqueRef(vif.VM)

  if (!vm) return []

  const guestMetrics = getGuestMetricsByOpaqueRef(vm.guest_metrics)

  if (!guestMetrics?.networks) return []

  return [...new Set(Object.values(guestMetrics.networks).sort())]
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

const emptyMessage = computed(() => {
  if (vifs.length === 0) {
    return t('no-vif-detected')
  }

  if (filteredVifs.value.length === 0) {
    return t('no-result')
  }

  return undefined
})

const { pageRecords: paginatedVifs, paginationBindings } = usePagination('vifs', filteredVifs)

const { HeadCells, BodyCells } = useVifColumns({
  body: (vif: XenApiVif) => ({
    network: r => r({ label: getNetworkName(vif.network) }),
    device: r => r(t('vif-device', { device: vif.device })),
    status: r => r(vif.currently_attached ? 'connected' : 'disconnected'),
    ipsAddresses: r => r(getIpAddresses(vif)),
    macAddresses: r => r(vif.MAC),
    mtu: r => r(vif.MTU),
    lockingMode: r => r(vif.locking_mode),
    selectId: r => r(() => (selectedVifId.value = vif.uuid)),
  }),
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

  .network {
    display: flex;
    align-items: center;
    gap: 1.8rem;
  }

  .ip-addresses {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .more-ips {
      color: var(--color-neutral-txt-secondary);
    }
  }

  .checkbox,
  .more {
    width: 4.8rem;
  }

  .checkbox {
    text-align: center;
    line-height: 1;
  }
}
</style>
