<template>
  <div class="container">
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
    <div class="content">
      <UiQuerySearchBar class="table-query" @search="value => (searchQuery = value)" />
      <UiTableActions title="Table actions">
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
      <div class="table">
        <VtsTable vertical-border>
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
                <ColumnTitle v-else :icon="getHeaderIcon(column.id)">
                  {{ column.label }}
                </ColumnTitle>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row of rows" :key="row.id">
              <td v-for="column of row.visibleColumns" :key="column.id" class="typo p2-regular">
                <UiCheckbox v-if="column.id === 'checkbox'" v-model="selected" accent="info" :value="row.id" />
                <VtsIcon v-else-if="column.id === 'more'" accent="info" :icon="faEllipsis" />
                <VtsConnectionStatus v-else-if="column.id === 'status'" :status="column.value" />
                <div v-else v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                  {{ column.value }}
                </div>
              </td>
            </tr>
          </tbody>
        </VtsTable>
      </div>
      <UiTopBottomTable
        :selected-items="selected.length"
        :total-items="networkUuids.length"
        @toggle-select-all="toggleSelect"
      />
    </div>
  </div>
  <UiCardSpinner v-if="!isReady" />
</template>

<script setup lang="ts">
import UiCardSpinner from '@/components/ui/UiCardSpinner.vue'
import useMultiSelect from '@/composables/multi-select.composable'
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types'
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
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

export type Status = 'connected' | 'disconnected' | 'partially-connected'

const { networks, isReady } = defineProps<{
  networks: {
    network: XenApiNetwork
    status: Status
    vlan?: string
  }[]
  isReady: boolean
}>()

const searchQuery = ref('')

const filteredNetworks = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()
  if (!searchTerm) {
    return networks
  }
  return networks.filter(network =>
    Object.values(network).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const networkUuids = computed(() => networks.map(network => network.network.uuid))

const { selected, areAllSelected } = useMultiSelect(networkUuids)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? networkUuids.value : []
}

const { visibleColumns, rows } = useTable('networks', filteredNetworks, {
  rowId: record => record.network.uuid,
  columns: define => [
    define('checkbox', () => '', { label: '', isHideable: false }),
    define('name_label', record => record.network.name_label, {
      label: 'Name',
      isHideable: true,
    }),
    define('name_description', record => record.network.name_description, {
      label: 'Description',
      isHideable: true,
    }),
    define('status', { label: 'PIFS Status', isHideable: true }),
    define('vlan', { label: 'VLAN', isHideable: true }),
    define('MTU', record => record.network.MTU, {
      label: 'MTU',
      isHideable: true,
    }),
    define('default_locking_mode', record => record.network.default_locking_mode, {
      label: 'Default Locking mode',
      isHideable: true,
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
.container,
.content {
  display: flex;
  flex-direction: column;
}

.container {
  gap: 2.4rem;

  .content {
    gap: 0.8rem;

    .table {
      overflow-x: auto;

      tr:last-child {
        border-bottom: 1px solid var(--color-neutral-border);
      }
    }

    .checkbox,
    .more {
      width: 4.8rem;
    }
  }

  @media (max-width: 1440px) {
    .table {
      table {
        width: 160rem;
      }
    }
  }
}
</style>
