<template>
  <div class="pool-host-internal-network-table">
    <UiTitle>
      {{ $t('host-internal-networks') }}
      <template #actions>
        <UiButton
          v-tooltip="$t('coming-soon')"
          disabled
          :left-icon="faPlus"
          variant="secondary"
          accent="info"
          size="medium"
        >
          {{ $t('new') }}
        </UiButton>
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
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsDataTable from '@core/components/table/VtsDataTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
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
  faEdit,
  faEllipsis,
  faHashtag,
  faPlus,
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

const getLockingMode = (lockingMode: string) => (lockingMode === 'disabled' ? t('disabled') : t('unlocked'))

const { visibleColumns, rows } = useTable('networks', filteredNetworks, {
  rowId: record => record.uuid,
  columns: define => [
    define('checkbox', () => '', { label: '', isHideable: false }),
    define('name_label', { label: t('name') }),
    define('name_description', { label: t('description') }),
    define('MTU', { label: t('mtu') }),
    define('default_locking_mode', record => getLockingMode(record.default_locking_mode), {
      label: t('default-locking-mode'),
    }),
    define('more', () => '', { label: '', isHideable: false }),
  ],
})

type NetworkHeader = 'name_label' | 'name_description' | 'MTU' | 'default_locking_mode' | 'more'

const headerIcon: Record<NetworkHeader, IconDefinition> = {
  name_label: faAlignLeft,
  name_description: faAlignLeft,
  MTU: faHashtag,
  default_locking_mode: faCaretDown,
  more: faEllipsis,
}

const getHeaderIcon = (status: NetworkHeader) => headerIcon[status]
</script>

<style scoped lang="postcss">
.pool-host-internal-network-table,
.table-actions {
  display: flex;
  flex-direction: column;
}

.pool-host-internal-network-table {
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

    tbody tr:hover {
      cursor: pointer;
      background-color: var(--color-info-background-hover);
    }

    tr:last-child {
      border-bottom: 0.1rem solid var(--color-neutral-border);
    }
  }

  .selected {
    background-color: var(--color-info-background-selected);
  }
}
</style>
