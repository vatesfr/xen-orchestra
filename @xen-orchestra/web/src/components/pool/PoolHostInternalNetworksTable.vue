<template>
  <div class="pool-host-internal-networks-table">
    <UiTitle>
      {{ $t('host-internal-networks') }}
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
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
        <UiTableActions :title="$t('table-actions')">
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
        <UiTopBottomTable :selected-items="0" :total-items="0" @toggle-select-all="toggleSelect" />
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
                <th v-if="column.id === 'checkbox'" v-tooltip="$t('coming-soon')" class="checkbox">
                  <UiCheckbox :v-model="areAllSelected" accent="info" disabled @update:model-value="toggleSelect" />
                </th>
                <th v-else-if="column.id === 'more'" class="more">
                  <UiButtonIcon v-tooltip="$t('coming-soon')" :icon="faEllipsis" accent="info" disabled size="small" />
                  {{ column.label }}
                </th>
                <th v-else>
                  <div v-tooltip class="text-ellipsis">
                    <VtsIcon accent="brand" :icon="headerIcon[column.id]" />
                    {{ column.label }}
                  </div>
                </th>
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
              <td
                v-for="column of row.visibleColumns"
                :key="column.id"
                class="typo p2-regular"
                :class="{ checkbox: column.id === 'checkbox' }"
              >
                <div v-if="column.id === 'checkbox'" v-tooltip="$t('coming-soon')">
                  <UiCheckbox v-model="selected" accent="info" :value="row.id" disabled />
                </div>
                <UiButtonIcon
                  v-else-if="column.id === 'more'"
                  v-tooltip="$t('coming-soon')"
                  :icon="faEllipsis"
                  accent="info"
                  disabled
                  size="small"
                />
                <div v-else v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                  {{ column.value }}
                </div>
              </td>
            </tr>
          </template>
        </VtsDataTable>
        <VtsStateHero v-if="searchQuery && filteredNetworks.length === 0" type="table" image="no-result">
          {{ $t('no-result') }}
        </VtsStateHero>
        <UiTopBottomTable :selected-items="0" :total-items="0" @toggle-select-all="toggleSelect" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import useMultiSelect from '@core/composables/table/multi-select.composable'
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
import { noop } from '@vueuse/shared'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { networksWithoutPifs: networks, isReady, hasError } = useNetworkStore().subscribe()

const { t } = useI18n()
const searchQuery = ref('')

const selectedNetworkId = useRouteQuery('id')

const filteredNetworks = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()
  if (!searchTerm) {
    return networks.value
  }
  return networks.value.filter(network =>
    Object.values(network).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const networkIds = computed(() => networks.value.map(network => network.id))

const { selected, areAllSelected } = useMultiSelect(networkIds)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? networkIds.value : []
}

const getLockingMode = (lockingMode: string) => (lockingMode === 'disabled' ? t('disabled') : t('unlocked'))

const { visibleColumns, rows } = useTable('networks', filteredNetworks, {
  rowId: record => record.id,
  columns: define => [
    define('checkbox', noop, { label: '', isHideable: false }),
    define('name_label', { label: t('name') }),
    define('name_description', { label: t('description') }),
    define('MTU', { label: t('mtu') }),
    define('default_locking_mode', record => getLockingMode(record.default_locking_mode), {
      label: t('default-locking-mode'),
    }),
    define('more', noop, { label: '', isHideable: false }),
  ],
})

type NetworkHeader = 'name_label' | 'name_description' | 'MTU' | 'default_locking_mode'

const headerIcon: Record<NetworkHeader, IconDefinition> = {
  name_label: faAlignLeft,
  name_description: faAlignLeft,
  MTU: faHashtag,
  default_locking_mode: faCaretDown,
}
</script>

<style scoped lang="postcss">
.pool-host-internal-networks-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.pool-host-internal-networks-table {
  gap: 2.4rem;
  .container,
  .table-actions {
    gap: 0.8rem;
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
