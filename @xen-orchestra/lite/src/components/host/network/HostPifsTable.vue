<template>
  <div class="host-pif-table">
    <UiTitle>
      {{ t('pifs') }}
      <template #actions>
        <UiButton
          v-tooltip="t('coming-soon!')"
          disabled
          left-icon="fa:plus"
          variant="secondary"
          accent="brand"
          size="medium"
        >
          {{ t('scan-pifs') }}
        </UiButton>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
        <UiTableActions :title="t('table-actions')">
          <UiButton
            v-tooltip="t('coming-soon!')"
            disabled
            left-icon="fa:edit"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ t('action:edit') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon!')"
            disabled
            left-icon="fa:trash"
            variant="tertiary"
            accent="danger"
            size="medium"
          >
            {{ t('action:delete') }}
          </UiButton>
        </UiTableActions>
      </div>
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="pif of paginatedPifs" :key="pif.uuid" :selected="selectedPifId === pif.uuid">
            <BodyCells :item="pif" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { XenApiNetwork, XenApiPif } from '@/libs/xen-api/xen-api.types'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useTableState } from '@core/composables/table-state.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { icon } from '@core/icons'
import { usePifColumns } from '@core/tables/column-sets/pif-columns'
import { logicNot } from '@vueuse/math'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { pifs } = defineProps<{
  pifs: XenApiPif[]
}>()

const { isReady, hasError } = usePifStore().subscribe()
const { getByOpaqueRef } = useNetworkStore().subscribe()
const { getPifStatus } = usePifStore().subscribe()

const { t } = useI18n()

const selectedPifId = useRouteQuery('id')

const getNetworkName = (networkRef: XenApiNetwork['$ref']) => getByOpaqueRef(networkRef)?.name_label ?? ''

const getVlanData = (vlan: number) => (vlan !== -1 ? vlan : t('none'))

const getIpAddresses = (pif: XenApiPif) => [pif.IP, ...pif.IPv6].filter(ip => ip)

const getIpConfigurationMode = (ipMode: string) => {
  switch (ipMode) {
    case 'Static':
      return t('static')
    case 'DHCP':
      return t('dhcp')
    default:
      return t('none')
  }
}

const searchQuery = ref('')

const filteredPifs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return pifs
  }

  return pifs.filter(pif =>
    [...Object.values(pif), getNetworkName(pif.network)].some(value =>
      String(value).toLocaleLowerCase().includes(searchTerm)
    )
  )
})

const state = useTableState({
  busy: logicNot(isReady),
  error: hasError,
  empty: () =>
    pifs.length === 0 ? t('no-pif-detected') : filteredPifs.value.length === 0 ? { type: 'no-result' } : false,
})

const { pageRecords: paginatedPifs, paginationBindings } = usePagination('pifs', filteredPifs)

function getManagementIcon(pif: XenApiPif) {
  if (!pif.management) {
    return undefined
  }

  return {
    icon: icon('legacy:primary'),
    tooltip: t('management'),
  }
}

const { HeadCells, BodyCells } = usePifColumns({
  body: (pif: XenApiPif) => {
    const name = computed(() => getNetworkName(pif.network))
    const status = computed(() => getPifStatus(pif))
    const vlan = computed(() => getVlanData(pif.VLAN))
    const ipAddresses = computed(() => getIpAddresses(pif))
    const ipMode = computed(() => getIpConfigurationMode(pif.ip_configuration_mode))
    const rightIcon = computed(() => getManagementIcon(pif))

    return {
      network: r => r({ label: name.value }),
      device: r => r(pif.device, { rightIcon: rightIcon.value }),
      status: r => r(status.value),
      vlan: r => r(vlan.value),
      ip: r => r(ipAddresses.value),
      mac: r => r(pif.MAC),
      mode: r => r(ipMode.value),
      selectItem: r => r(() => (selectedPifId.value = pif.uuid)),
    }
  },
})
</script>

<style scoped lang="postcss">
.host-pif-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.host-pif-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
