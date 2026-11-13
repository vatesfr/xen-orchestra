<template>
  <div class="pifs-table">
    <UiTitle>
      {{ t('pifs') }}
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
          <VtsRow v-for="pif of paginatedPifs" :key="pif.id" :selected="selectedPifId === pif.id">
            <BodyCells :item="pif" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import { usePifManagementReconfigureModal } from '@/modules/pif/composables/use-pif-management-reconfigure-modal.composable.ts'
import { type FrontXoPif, useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { getPifStatus } from '@/modules/pif/utils/xo-pif.util.ts'
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
import { usePifColumns } from '@core/tables/column-sets/pif-columns.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { compareFirstStrings, compareStrings } from '@core/utils/compare-strings.util.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { IP_CONFIGURATION_MODE } from '@vates/types'
import { logicAnd, logicNot, logicOr } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pifs: rawPifs } = defineProps<{
  pifs: FrontXoPif[]
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { arePifsReady, hasPifFetchError } = useXoPifCollection()
const { getNetworkById, useGetNetworkById, areNetworksReady, hasNetworkFetchError } = useXoNetworkCollection()

const isReady = logicAnd(arePifsReady, areNetworksReady)

const hasError = logicOr(hasPifFetchError, hasNetworkFetchError)

const { t } = useI18n()

const selectedPifId = useRouteQuery('id')

const { items: filteredPifs, filter } = useQueryBuilderFilter('pifs', () => rawPifs)

const schema = useQueryBuilderSchema<FrontXoPif>({
  '': useStringSchema(t('any-property')),
  device: useStringSchema(t('device')),
  attached: useBooleanSchema(t('status'), {
    true: t('connected'),
    false: t('disconnected'),
  }),
  vlan: useNumberSchema(t('vlan')),
  ip: useStringSchema(t('ip-address')),
  mac: useStringSchema(t('mac-address')),
  mode: useStringSchema(t('ip-mode'), {
    [IP_CONFIGURATION_MODE.STATIC]: t('static'),
    [IP_CONFIGURATION_MODE.DHCP]: t('dhcp'),
    [IP_CONFIGURATION_MODE.NONE]: t('none'),
  }),
})

const state = useTableState({
  busy: logicNot(isReady),
  error: hasError,
  empty: () =>
    rawPifs.length === 0 ? t('no-pif-detected') : filteredPifs.value.length === 0 ? { type: 'no-result' } : false,
})

const getVlanData = (vlan: number) => (vlan !== -1 ? vlan : t('none'))

const getIpAddresses = (pif: FrontXoPif) => [pif.ip, ...pif.ipv6].filter(ip => ip)

const getIpConfigurationMode = (ipMode: IP_CONFIGURATION_MODE) => {
  switch (ipMode) {
    case 'Static':
      return t('static')
    case 'DHCP':
      return t('dhcp')
    default:
      return t('none')
  }
}

const getNetworkName = (pif: FrontXoPif) => getNetworkById(pif.$network)?.name_label ?? ''

const { compareStatuses } = useStatusLabel()

function getManagementIcon(pif: FrontXoPif) {
  if (!pif.management) {
    return undefined
  }

  return {
    icon: icon('status:primary-circle'),
    tooltip: t('management'),
  }
}

const { HeadCells, BodyCells, sortItems } = usePifColumns({
  exclude: ['selectItem'],
  body: (pif: FrontXoPif) => {
    const status = computed(() => getPifStatus(pif))
    const vlan = computed(() => getVlanData(pif.vlan))
    const ip = computed(() => getIpAddresses(pif))
    const mode = computed(() => getIpConfigurationMode(pif.mode))
    const rightIcon = computed(() => getManagementIcon(pif))

    const network = useGetNetworkById(() => pif.$network)

    const poolNetworkRoute = computed(() =>
      network.value ? getPoolNetworkRoute(network.value.$pool, network.value.id) : undefined
    )

    const {
      openModal: openManagementReconfigureModal,
      canRun: canReconfigureManagement,
      isRunning: isReconfiguringManagement,
      errorMessage: reconfigureManagementErrorMessage,
    } = usePifManagementReconfigureModal(() => pif)

    return {
      network: r =>
        network.value
          ? r({
              label: network.value.name_label,
              to: poolNetworkRoute.value,
              icon: 'object:network',
            })
          : renderBodyCell(),
      device: r => r(pif.device, { rightIcon: rightIcon.value }),
      status: r => r(status.value),
      vlan: r => r(vlan.value),
      ip: r => r(ip.value),
      mac: r => r(pif.mac),
      mode: r => r(mode.value),
      actions: r =>
        r({
          onClick: () => (selectedPifId.value = pif.id),
          actions: [
            {
              label: t('action:set-pif-management'),
              hint: reconfigureManagementErrorMessage.value,
              icon: canReconfigureManagement.value ? 'status:primary-circle' : 'status:primary-circle-disabled',
              onClick: () => openManagementReconfigureModal(),
              disabled: !canReconfigureManagement.value,
              busy: isReconfiguringManagement.value,
            },
          ],
        }),
    }
  },
  sort: {
    // Same order as the PIF collection: by network name, then by device
    network: (pif1, pif2) =>
      compareStrings(getNetworkName(pif1), getNetworkName(pif2)) || compareStrings(pif1.device, pif2.device),
    device: (pif1, pif2) => compareStrings(pif1.device, pif2.device),
    status: (pif1, pif2) => compareStatuses(getPifStatus(pif1), getPifStatus(pif2)),
    vlan: (pif1, pif2) => pif1.vlan - pif2.vlan,
    ip: (pif1, pif2) => compareFirstStrings(getIpAddresses(pif1), getIpAddresses(pif2)),
    mac: (pif1, pif2) => compareStrings(pif1.mac, pif2.mac),
    mode: (pif1, pif2) => compareStrings(getIpConfigurationMode(pif1.mode), getIpConfigurationMode(pif2.mode)),
  },
  initialSort: { id: 'network', direction: 'asc' },
})

const sortedPifs = computed(() => sortItems(filteredPifs.value))

const { pageRecords: paginatedPifs, paginationBindings } = usePagination('pifs', sortedPifs)
</script>

<style scoped lang="postcss">
.pifs-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.pifs-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
