<template>
  <div class="pool-networks-table">
    <UiTitle>
      {{ $t('networks') }}
      <template #actions>
        <UiDropdownButton
          v-tooltip="$t('coming-soon')"
          disabled
          :left-icon="faPlus"
          variant="secondary"
          accent="info"
          size="medium"
        >
          {{ $t('new') }}
        </UiDropdownButton>
      </template>
    </UiTitle>
    <div class="table-actions">
      <UiQuerySearchBar class="table-query" @search="value => (searchQuery = value)" />
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
          :left-icon="faCopy"
          variant="tertiary"
          accent="info"
          size="medium"
        >
          {{ $t('copy-info-json') }}
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
        :total-items="networkUuids.length"
        @toggle-select-all="toggleSelect"
      />
    </div>
    <div class="table-container">
      <VtsDataTable
        :is-ready
        :has-error
        :no-data-message="networks.length === 0 ? $t('no-network-detected') : undefined"
      >
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th v-if="column.id === 'checkbox'" class="checkbox">
                <UiCheckbox :v-model="areAllSelected" accent="info" @update:model-value="toggleSelect" />
              </th>
              <th v-else-if="column.id === 'more'" class="more">
                <UiButtonIcon size="small" accent="info" :icon="getHeaderIcon(column.id)" />
                {{ column.label }}
              </th>
              <ColumnTitle v-else :icon="getHeaderIcon(column.id)">
                <span class="text-ellipsis">{{ column.label }}</span>
              </ColumnTitle>
            </template>
          </tr>
        </template>
        <template #tbody>
          <tr
            v-for="row of rows"
            :key="row.id"
            :class="{ selected: selectedNetworkId === row.id }"
            @click="selectedNetworkId = row.id"
          >
            <td v-for="column of row.visibleColumns" :key="column.id" class="typo p2-regular">
              <UiCheckbox v-if="column.id === 'checkbox'" v-model="selected" accent="info" :value="row.id" />
              <VtsIcon v-else-if="column.id === 'more'" accent="info" :icon="faEllipsis" />
              <VtsConnectionStatus v-else-if="column.id === 'status'" :status="column.value" />
              <div v-else v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                {{ column.value }}
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <VtsStateHero v-if="searchQuery && filteredNetworks.length === 0" type="table" image="no-result">
        <div>{{ $t('no-result') }}</div>
      </VtsStateHero>
      <UiTopBottomTable
        :selected-items="selected.length"
        :total-items="networkUuids.length"
        @toggle-select-all="toggleSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import useMultiSelect from '@/composables/multi-select.composable'
import type { XenApiNetwork, XenApiPif } from '@/libs/xen-api/xen-api.types'
import { usePifStore } from '@/stores/xen-api/pif.store'
import VtsConnectionStatus, { type ConnectionStatus } from '@core/components/connection-status/VtsConnectionStatus.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsDataTable from '@core/components/table/VtsDataTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
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
  faCaretDown,
  faCopy,
  faEdit,
  faEllipsis,
  faHashtag,
  faPlus,
  faPowerOff,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { networks } = defineProps<{
  networks: XenApiNetwork[]
  isReady: boolean
  hasError: boolean
}>()

const { t } = useI18n()
const searchQuery = ref('')
const selectedNetworkId = useRouteQuery('id')
const { records: pifs } = usePifStore().subscribe()

const filteredNetworks = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()
  if (!searchTerm) {
    return networks
  }
  return networks.filter(network =>
    Object.values(network).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const networkUuids = computed(() => networks.map(network => network.uuid))

const { selected, areAllSelected } = useMultiSelect(networkUuids)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? networkUuids.value : []
}

const getNetworkVlan = (network: XenApiNetwork) => {
  const networkPIFs = pifs.value.filter(pif => network.PIFs?.includes(pif.$ref))
  if (networkPIFs.length > 0) {
    return networkPIFs[0].VLAN !== -1 ? networkPIFs[0].VLAN.toString() : t('none')
  }
}

const pifsStatus = (PIFs: XenApiPif[]): ConnectionStatus => {
  if (PIFs.length === 0) {
    return 'disconnected'
  }
  const currentlyAttached = PIFs.map(PIF => PIF.currently_attached)
  if (currentlyAttached.every(Boolean)) {
    return 'connected'
  }
  if (currentlyAttached.some(Boolean)) {
    return 'partially-connected'
  }
  return 'disconnected'
}

const getNetworkStatus = (network: XenApiNetwork) => {
  const networkPIFs = pifs.value.filter(pif => network.PIFs?.includes(pif.$ref))
  return pifsStatus(networkPIFs)
}

const getLockingMode = (lockingMode: string) => (lockingMode === 'disabled' ? t('disabled') : t('unlocked'))

const { visibleColumns, rows } = useTable('networks', filteredNetworks, {
  rowId: record => record.uuid,
  columns: define => [
    define('checkbox', () => '', { label: '', isHideable: false }),
    define('name_label', record => record.name_label, { label: t('name') }),
    define('name_description', record => record.name_description, { label: t('description') }),
    define('status', record => getNetworkStatus(record), { label: t('pifs-status') }),
    define('vlan', record => getNetworkVlan(record), { label: t('vlan') }),
    define('MTU', record => record.MTU, { label: t('mtu') }),
    define('default_locking_mode', record => getLockingMode(record.default_locking_mode), {
      label: t('default-locking-mode'),
    }),
    define('more', () => '', { label: '', isHideable: false }),
  ],
})

type NetworkHeader = 'name_label' | 'name_description' | 'status' | 'vlan' | 'MTU' | 'default_locking_mode' | 'more'
const headerIcon: Record<NetworkHeader, IconDefinition> = {
  name_label: faAlignLeft,
  name_description: faAlignLeft,
  status: faPowerOff,
  vlan: faAlignLeft,
  MTU: faHashtag,
  default_locking_mode: faCaretDown,
  more: faEllipsis,
}

const getHeaderIcon = (status: NetworkHeader) => headerIcon[status]
</script>

<style scoped lang="postcss">
.pool-networks-table,
.table-actions {
  display: flex;
  flex-direction: column;
}

.pool-networks-table {
  gap: 2.4rem;

  .table-actions {
    gap: 0.8rem;
  }

  .table-container {
    overflow-x: auto;

    .checkbox,
    .more {
      width: 4.8rem;
    }

    ::deep(.col-status) {
      width: 2rem;
    }
  }

  tbody tr:hover {
    cursor: pointer;
    background-color: var(--color-info-background-hover);
  }

  tr:last-child {
    border-bottom: 0.1rem solid var(--color-neutral-border);
  }

  .selected {
    background-color: var(--color-info-background-selected);
  }
}
</style>
