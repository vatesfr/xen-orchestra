<template>
  <div class="pool-host-internal-networks-table">
    <UiTitle>
      {{ $t('host-internal-networks') }}
      <template #actions>
        <UiButton disabled :left-icon="faPlus" variant="secondary" accent="info" size="medium">
          {{ $t('new') }}
        </UiButton>
      </template>
    </UiTitle>
    <div class="table-actions">
      <UiQuerySearchBar class="table-query" @search="(value: string) => (searchQuery = value)" />
      <UiTableActions :title="$t('table-actions')">
        <UiButton disabled :left-icon="faEdit" variant="tertiary" accent="info" size="medium">
          {{ $t('edit') }}
        </UiButton>
        <UiButton disabled :left-icon="faTrash" variant="tertiary" accent="danger" size="medium">
          {{ $t('delete') }}
        </UiButton>
      </UiTableActions>
      <div class="selection">
        <UiTopBottomTable
          :selected-items="selected.length"
          :total-items="usableIds.length"
          @toggle-select-all="toggleSelect"
        />
        <UiTablePagination
          v-model:curr-page="pagination.currentPage"
          v-model:per-page="pagination.pageSize"
          v-model:start-index="pagination.startIndex"
          v-model:end-index="pagination.endIndex"
          :total-items="usableIds.length"
        />
      </div>
    </div>
    <div class="table-container">
      <VtsLoadingHero :disabled="isReady" type="table">
        <VtsTable class="table" vertical-border>
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
              :class="{ selected: selectedNetworkId === row.id }"
              @click="selectedNetworkId = row.id"
            >
              <td v-for="column of row.visibleColumns" :key="column.id" class="typo p2-regular">
                <UiCheckbox v-if="column.id === 'checkbox'" v-model="selected" accent="info" :value="row.id" />
                <div v-else-if="column.id === 'more'">
                  <VtsIcon accent="info" :icon="faEllipsis" />
                </div>
                <div v-else v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                  {{ column.value }}
                </div>
              </td>
            </tr>
          </tbody>
        </VtsTable>
      </VtsLoadingHero>
      <VtsErrorNoDataHero v-if="hasError" type="table" />
      <VtsStateHero v-if="searchQuery && filteredNetworks.length === 0" type="table" image="no-result">
        <div>{{ $t('no-result') }}</div>
      </VtsStateHero>
      <VtsStateHero v-if="networksByPool.length === 0" type="table" image="no-data">
        <div>{{ $t('no-network-detected') }}</div>
      </VtsStateHero>
      <VtsStateHero v-if="hasError" type="table" image="error">
        <div>{{ $t('error-no-data') }}</div>
      </VtsStateHero>
      <VtsLoadingHero v-if="!isReady" type="table" />
    </div>
    <div class="selection">
      <UiTopBottomTable
        :selected-items="selected.length"
        :total-items="usableIds.length"
        @toggle-select-all="toggleSelect"
      />
      <UiTablePagination
        v-model:curr-page="pagination.currentPage"
        v-model:per-page="pagination.pageSize"
        v-model:start-index="pagination.startIndex"
        v-model:end-index="pagination.endIndex"
        :total-items="usableIds.length"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPool } from '@/types/xo/pool.type'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsErrorNoDataHero from '@core/components/state-hero/VtsErrorNoDataHero.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTablePagination, { type PaginationPayload } from '@core/components/ui/table-pagination/UiTablePagination.vue'
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
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: XoPool
}>()

const pagination = ref<PaginationPayload>({
  currentPage: 1,
  pageSize: 10,
  startIndex: 0,
  endIndex: 0,
})

const { t } = useI18n()
const { networksWithoutPifs, isReady, hasError } = useNetworkStore().subscribe()
const networksByPool = computed(() => networksWithoutPifs.value.filter(network => network.$pool === pool.id))
const selectedNetworkId = useRouteQuery('id')

const findPageById = () => {
  const index = networksByPool.value.findIndex(network => network.id === selectedNetworkId.value)
  if (index === -1) return null
  pagination.value.currentPage = Math.floor(index / pagination.value.pageSize) + 1
}

watch(
  () => networksByPool,
  () => {
    findPageById()
  }
)

const searchQuery = ref('')

const filteredNetworks = computed(() => {
  let filtered = networksByPool.value
  if (!searchQuery.value) {
    return networksByPool.value.slice(pagination.value.startIndex - 1, pagination.value.endIndex)
  }
  filtered = networksByPool.value.filter(network =>
    Object.values(network).some(value => String(value).toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
  return filtered.slice(pagination.value.startIndex - 1, pagination.value.endIndex)
})

const usableIds = computed(() => networksByPool.value.map(network => network.id))

const { selected, areAllSelected } = useMultiSelect(usableIds)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? usableIds.value : []
}

const getLockingMode = (lockingMode: boolean) => {
  return lockingMode ? t('disabled') : t('unlocked')
}

const { visibleColumns, rows } = useTable('networks', filteredNetworks, {
  rowId: record => record.id,
  columns: define => [
    define('checkbox', () => '', { label: '', isHideable: false }),
    define('name_label', (record: XoNetwork) => record.name_label, { label: t('name') }),
    define('name_description', (record: XoNetwork) => record.name_description, {
      label: t('description'),
    }),
    define('MTU', { label: 'MTU' }),
    define('default_locking_mode', (record: XoNetwork) => getLockingMode(record.defaultIsLocked), {
      label: t('locking-mode-default'),
    }),
    define('more', () => '', { label: '', isHideable: false }),
  ],
})

type networkHeader = 'name_label' | 'name_description' | 'MTU' | 'default_locking_mode' | 'more'

const headerIcon: Record<networkHeader, IconDefinition> = {
  name_label: faAlignLeft,
  name_description: faAlignLeft,
  MTU: faHashtag,
  default_locking_mode: faCaretDown,
  more: faEllipsis,
}

const getHeaderIcon = (status: networkHeader) => headerIcon[status]
</script>

<style scoped lang="postcss">
.pool-host-internal-networks-table,
.table-actions {
  display: flex;
  flex-direction: column;
}

.pool-host-internal-networks-table {
  gap: 2.4rem;
  overflow: hidden;

  .table-actions {
    gap: 0.8rem;
  }

  .selection {
    margin: 0.8rem 0;
    display: flex;
    justify-content: space-between;
  }

  .table-container {
    overflow-x: auto;

    .table {
      .checkbox,
      .more {
        width: 4.5rem;
      }

      :deep(.col-MTU) {
        width: 8.5rem;
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
      border-bottom: 0.1rem solid var(--color-neutral-border);
    }
  }

  .selected {
    background-color: var(--color-info-background-selected);
  }
}
</style>
