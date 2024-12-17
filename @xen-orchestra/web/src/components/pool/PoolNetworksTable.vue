<template>
  <div class="pool-networks-table">
    <UiTitle>
      {{ $t('networks') }}
      <template #actions>
        <UiDropdownButton disabled>{{ $t('new') }}</UiDropdownButton>
      </template>
    </UiTitle>
    <div class="table-actions">
      <UiQuerySearchBar class="table-query" @search="(value: string) => (searchQuery = value)" />
      <UiTableActions title="Table actions">
        <UiButton disabled :left-icon="faEdit" variant="tertiary" accent="info" size="medium">
          {{ $t('edit') }}
        </UiButton>
        <UiButton disabled :left-icon="faCopy" variant="tertiary" accent="info" size="medium">
          {{ $t('copy-info-json') }}
        </UiButton>
        <UiButton disabled :left-icon="faTrash" variant="tertiary" accent="danger" size="medium">
          {{ $t('delete') }}
        </UiButton>
      </UiTableActions>
      <UiTopBottomTable
        :selected-items="selected.length"
        :total-items="usableIds.length"
        @toggle-select-all="toggleSelect"
      />
    </div>
    <div class="table-container">
      <VtsTable v-if="isReady" class="table" vertical-border>
        <thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th v-if="column.id === 'checkbox'" class="checkbox">
                <UiCheckbox :v-model="areAllSelected" accent="info" @update:model-value="toggleSelect" />
              </th>
              <th v-else-if="column.id === 'more'" class="more">
                <UiButtonIcon size="small" accent="info" :icon="getHeaderIcon(column.id)" />
                {{ column.label }}
              </th>
              <ColumnTitle v-else id="networks" :header-class="`col-${column.id}`" :icon="getHeaderIcon(column.id)">
                {{ column.label }}
              </ColumnTitle>
            </template>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row of rows"
            :key="row.id"
            :class="{ 'row-selected': selectedRowId === row.id }"
            @click="selectRow(row.value, 'network')"
          >
            <td v-for="column of row.visibleColumns" :key="column.id" class="typo p2-regular">
              <div>
                <UiCheckbox v-if="column.id === 'checkbox'" v-model="selected" accent="info" :value="row.id" />
              </div>
              <div v-if="column.id === 'name_label'" v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                {{ column.value }}
              </div>
              <div
                v-if="column.id === 'name_description'"
                v-tooltip="{ placement: 'bottom-end' }"
                class="text-ellipsis"
              >
                {{ column.value }}
              </div>
              <div v-if="column.id === 'status'" class="status">
                <PoolNetworksPifStatus :network="row.value" />
              </div>
              <div v-if="column.id === 'vlan'" v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                {{ getNetworkVlan(row.value) }}
              </div>
              <div v-if="column.id === 'MTU'" v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                {{ column.value }}
              </div>
              <div
                v-if="column.id === 'default_locking_mode'"
                v-tooltip="{ placement: 'bottom-end' }"
                class="text-ellipsis"
              >
                {{ getLockingMode(column.value) }}
              </div>
              <div v-if="column.id === 'more'">
                <VtsIcon accent="info" :icon="faEllipsis" />
              </div>
            </td>
          </tr>
        </tbody>
      </VtsTable>
      <VtsStateHero v-if="searchQuery && filteredNetworks.length === 0" type="table" image="no-result">
        <div>{{ $t('no-result') }}</div>
      </VtsStateHero>
      <VtsStateHero v-if="networks.length === 0" type="table" image="no-data">
        <div>{{ $t('no-network-detected') }}</div>
      </VtsStateHero>
      <VtsStateHero v-if="hasError" type="table" image="error">
        <div>{{ $t('error-no-data') }}</div>
      </VtsStateHero>
      <VtsLoadingHero v-if="!isReady" type="table" />
      <UiTopBottomTable
        :selected-items="selected.length"
        :total-items="usableIds.length"
        @toggle-select-all="toggleSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import PoolNetworksPifStatus from '@/components/pool/PoolNetworkPifStatus.vue'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoNetwork } from '@/types/xo/network.type'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import useMultiSelect from '@core/composables/table/multi-select.composable'
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
  faPowerOff,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  networks: XoNetwork[]
  isReady: boolean
  hasError: boolean
  selectedRowId: string | null
}>()

const emit = defineEmits<{
  rowSelectNetwork: [value: any]
}>()

const { t } = useI18n()

const { records: pifs } = usePifStore().subscribe()

const selectRow = (item: any, table: string) => {
  emit('rowSelectNetwork', { item, table })
}

const searchQuery = ref('')

const filteredNetworks = computed(() => {
  return searchQuery.value
    ? props.networks.filter(network =>
        Object.values(network).some(value => String(value).toLowerCase().includes(searchQuery.value.toLowerCase()))
      )
    : props.networks
})

const getNetworkVlan = (network: XoNetwork) => {
  const networkPIFs = pifs.value.filter(pif => network.PIFs.includes(pif.id))
  if (networkPIFs.length > 0) {
    return networkPIFs[0].vlan !== -1 ? networkPIFs[0].vlan.toString() : t('none')
  }
}

const getLockingMode = (lockingMode: boolean) => {
  return lockingMode ? t('disabled') : t('unlocked')
}

const usableIds = computed(() => props.networks.map(network => network.id))
const { selected, areAllSelected } = useMultiSelect(usableIds)
const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? usableIds.value : []
}

const { visibleColumns, rows } = useTable('networks', filteredNetworks, {
  rowId: record => record.id,
  columns: define => [
    define('checkbox', () => '', { label: '', isHideable: false }),
    define('name_label', record => record.name_label, {
      label: 'Name',
      isHideable: true,
    }),
    define('name_description', record => record.name_description, {
      label: 'Description',
      isHideable: true,
    }),
    define('status', () => '', { label: 'PIFS Status', isHideable: true }),
    define('vlan', () => '', { label: 'VLAN', isHideable: true }),
    define('MTU', record => record.MTU, {
      label: 'MTU',
      isHideable: true,
    }),
    define('default_locking_mode', record => record.defaultIsLocked, {
      label: 'Default Locking mode',
      isHideable: true,
    }),
    define('more', () => '', { label: '', isHideable: false }),
  ],
})

type networkHeader = 'name_label' | 'name_description' | 'status' | 'vlan' | 'MTU' | 'default_locking_mode' | 'more'
const headerIcon: Record<networkHeader, { icon: IconDefinition }> = {
  name_label: { icon: faAlignLeft },
  name_description: { icon: faAlignLeft },
  status: { icon: faPowerOff },
  vlan: { icon: faAlignLeft },
  MTU: { icon: faHashtag },
  default_locking_mode: { icon: faCaretDown },
  more: { icon: faEllipsis },
}
const getHeaderIcon = (status: networkHeader) => headerIcon[status].icon
</script>

<style scoped lang="postcss">
.pool-networks-table,
.table-actions {
  display: flex;
  flex-direction: column;
}

.pool-networks-table {
  gap: 2.4rem;
  overflow: hidden;

  .table-actions {
    gap: 0.8rem;
  }

  .table-container {
    overflow-x: auto;

    .table {
      .checkbox,
      .more {
        width: 4.5rem;
      }

      :deep(.col-vlan),
      :deep(.col-MTU) {
        width: 8.5rem;
      }

      :deep(.col-status) {
        width: 18rem;
      }

      :deep(.col-default_locking_mode) {
        width: 18rem;
      }

      :deep(.col-name_label),
      :deep(.col-name_description) {
        width: 20rem;
      }
    }

    tbody tr:hover {
      cursor: pointer;
      background-color: var(--color-info-background-hover);
    }

    tr:last-child {
      border-bottom: 1px solid var(--color-neutral-border);
    }
  }

  .row-selected {
    background-color: var(--color-info-background-selected);
  }
}
</style>
