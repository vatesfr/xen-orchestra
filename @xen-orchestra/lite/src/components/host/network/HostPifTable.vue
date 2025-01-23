<template>
  <div class="host-pif-table">
    <UiTitle>
      {{ $t('pifs') }}
      <template #actions>
        <UiButton
          v-tooltip="$t('coming-soon')"
          disabled
          :left-icon="faPlus"
          variant="secondary"
          accent="info"
          size="medium"
        >
          {{ $t('scan-pifs') }}
        </UiButton>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
        <UiTableActions :title="t('table-actions')">
          <UiButton
            v-tooltip="$t('coming-soon')"
            disabled
            :left-icon="faEdit"
            variant="tertiary"
            accent="info"
            size="medium"
          >
            {{ $t('edit') }}
          </UiButton>
          <UiButton
            v-tooltip="$t('coming-soon')"
            disabled
            :left-icon="faTrash"
            variant="tertiary"
            accent="danger"
            size="medium"
          >
            {{ $t('delete') }}
          </UiButton>
        </UiTableActions>
        <UiTopBottomTable
          :selected-items="selected.length"
          :total-items="pifsUuids.length"
          @toggle-select-all="toggleSelect"
        />
      </div>
      <VtsDataTable :is-ready :has-error :no-data-message="pifs.length === 0 ? $t('no-pif-detected') : undefined">
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th v-if="column.id === 'checkbox'" class="checkbox">
                <UiCheckbox :v-model="areAllSelected" accent="info" @update:model-value="toggleSelect" />
              </th>
              <th v-else-if="column.id === 'more'" v-tooltip="$t('coming-soon')" class="more">
                <UiButtonIcon size="small" accent="info" :icon="faEllipsis" />
                {{ column.label }}
              </th>
              <ColumnTitle v-else id="networks" :icon="headerIcon[column.id]"> {{ column.label }}</ColumnTitle>
            </template>
          </tr>
        </template>
        <template #tbody>
          <tr
            v-for="row of rows"
            :key="row.id"
            :class="{ selected: selectedPifId === row.id }"
            @click="selectedPifId = row.id"
          >
            <td
              v-for="column of row.visibleColumns"
              :key="column.id"
              class="typo p2-regular"
              :class="{ checkbox: column.id === 'checkbox' }"
            >
              <UiCheckbox v-if="column.id === 'checkbox'" v-model="selected" accent="info" :value="row.id" />
              <VtsIcon
                v-else-if="column.id === 'more'"
                v-tooltip="$t('coming-soon')"
                accent="info"
                :icon="faEllipsis"
              />
              <div v-else-if="column.id === 'status'" v-tooltip>
                <VtsConnectionStatus :status="column.value" />
              </div>
              <div v-else-if="column.id === 'network'" class="network">
                <UiComplexIcon size="medium" class="icon">
                  <VtsIcon :icon="faNetworkWired" accent="current" />
                  <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
                </UiComplexIcon>
                <a v-tooltip href="" class="text-ellipsis name">{{ column.value.name }}</a>
                <VtsIcon
                  v-if="column.value.management"
                  v-tooltip="t('management')"
                  accent="warning"
                  :icon="faCircle"
                  :overlay-icon="faStar"
                />
              </div>
              <div v-else v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                {{ column.value }}
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <VtsStateHero v-if="searchQuery && filteredPifs.length === 0" type="table" image="no-result">
        <div>{{ $t('no-result') }}</div>
      </VtsStateHero>
      <UiTopBottomTable
        :selected-items="selected.length"
        :total-items="pifsUuids.length"
        @toggle-select-all="toggleSelect"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import useMultiSelect from '@/composables/multi-select.composable'
import type { XenApiNetwork, XenApiPif } from '@/libs/xen-api/xen-api.types'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { usePifMetricsStore } from '@/stores/xen-api/pif-metrics.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsDataTable from '@core/components/table/VtsDataTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiComplexIcon from '@core/components/ui/complex-icon/UiComplexIcon.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useTable } from '@core/composables/table.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import {
  faAlignLeft,
  faAt,
  faCaretDown,
  faCheck,
  faCircle,
  faEdit,
  faEllipsis,
  faNetworkWired,
  faPlus,
  faPowerOff,
  faStar,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { currentHostPifs: pifs, isReady, hasError } = usePifStore().subscribe()
const { getByOpaqueRef } = useNetworkStore().subscribe()
const { getPifCarrier } = usePifMetricsStore().subscribe()

const { t } = useI18n()
const selectedPifId = useRouteQuery('id')
const searchQuery = ref('')

const filteredPifs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()
  if (!searchTerm) {
    return pifs.value
  }
  return pifs.value.filter(pif =>
    Object.values(pif).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const pifsUuids = computed(() => pifs.value.map(pif => pif.uuid))

const { selected, areAllSelected } = useMultiSelect(pifsUuids)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? pifsUuids.value : []
}

const getNetworkName = (networkRef: string) => {
  const network: XenApiNetwork = getByOpaqueRef(networkRef as XenApiNetwork['$ref'])!
  return network?.name_label ? network.name_label : ''
}

const getVlanData = (vlan: number) => (vlan !== -1 ? vlan : t('none'))

const getPifStatus = (pif: XenApiPif) => {
  const carrier = getPifCarrier(pif)
  const currentlyAttached = pif.currently_attached

  if (currentlyAttached && carrier) {
    return 'connected'
  }
  if (currentlyAttached && !carrier) {
    return 'partially-connected'
  }
  return 'disconnected'
}

const { visibleColumns, rows } = useTable('pifs', filteredPifs, {
  rowId: record => record.uuid,
  columns: define => [
    define('checkbox', () => '', { label: '', isHideable: false }),
    define(
      'network',
      record => ({
        name: getNetworkName(record.network),
        management: record.management,
      }),
      { label: t('network') }
    ),
    define('device', { label: t('device') }),
    define('status', record => getPifStatus(record), { label: t('status') }),
    define('VLAN', record => getVlanData(record.VLAN), { label: t('vlan') }),
    define('IP', { label: t('ip-addresses') }),
    define('MAC', { label: t('mac-addresses') }),
    define('ip_configuration_mode', { label: t('ip-mode') }),
    define('more', () => '', { label: '', isHideable: false }),
  ],
})
type PifHeader = 'network' | 'device' | 'status' | 'VLAN' | 'IP' | 'MAC' | 'ip_configuration_mode'
const headerIcon: Record<PifHeader, IconDefinition> = {
  network: faAlignLeft,
  device: faAlignLeft,
  status: faPowerOff,
  VLAN: faAlignLeft,
  IP: faAt,
  MAC: faAt,
  ip_configuration_mode: faCaretDown,
}
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

  .network {
    display: flex;
    align-items: center;
    gap: 1.8rem;
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
