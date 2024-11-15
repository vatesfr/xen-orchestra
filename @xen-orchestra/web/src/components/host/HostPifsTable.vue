<template>
  <div class="pif-table">
    <UiTitle type="h4" class="header">
      <slot>{{ $t('pifs') }}</slot>
      <template #actions>
        <UiButton disabled size="medium" variant="secondary" accent="info" :left-icon="faArrowsRotate">
          {{ $t('scan-pifs') }}
        </UiButton>
      </template>
    </UiTitle>
    <div class="table-actions">
      <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
      <UiTableActions>
        <UiButton size="medium" variant="tertiary" accent="info" :left-icon="faEdit" disabled>
          {{ $t('edit') }}
        </UiButton>
        <UiButton size="medium" variant="tertiary" accent="info" :left-icon="faTrash" disabled>
          {{ $t('delete') }}
        </UiButton>
        <template #title>
          <UiActionsTitle> {{ $t('table-actions') }}</UiActionsTitle>
        </template>
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
      <VtsDataTable
        :is-ready
        :has-error
        :no-data-message="props.pifs.length === 0 ? $t('no-network-detected') : undefined"
      >
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th v-if="column.id === 'checkbox'" class="checkbox">
                <UiCheckbox :v-model="areAllSelected" accent="info" @update:model-value="toggleSelect" />
              </th>
              <th v-else-if="column.id === 'more'" class="more">
                <UiButtonIcon size="small" accent="info" :icon="faEllipsis" />
                {{ column.label }}
              </th>
              <ColumnTitle v-else :id="column.id" :header-class="`col-${column.id}`" :icon="headerIcon[column.id]">
                {{ column.label }}
              </ColumnTitle>
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
            <td v-for="column of row.visibleColumns" :key="column.id" class="typo p2-regular">
              <div v-if="column.id === 'checkbox'">
                <UiCheckbox v-model="selected" accent="info" :value="row.id" />
              </div>
              <div v-else-if="column.id === 'status'" class="status">
                <PifStatus :network="getNetwork(row.value)" />
              </div>
              <div v-else-if="column.id === 'more'">
                <VtsIcon accent="info" :icon="faEllipsis" />
              </div>
              <div v-else v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                <UiComplexIcon v-if="column.id === 'network'" size="medium" class="icon">
                  <VtsIcon :icon="faNetworkWired" accent="current" />
                  <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
                </UiComplexIcon>
                {{ column.value }}
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
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
import PifStatus from '@/components/pif/PifStatus.vue'
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import type { XoPif } from '@/types/xo/pif.type'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsDataTable from '@core/components/table/VtsDataTable.vue'
import UiActionsTitle from '@core/components/ui/actions-title/UiActionsTitle.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiComplexIcon from '@core/components/ui/complex-icon/UiComplexIcon.vue'
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
  faArrowsRotate,
  faAt,
  faCaretDown,
  faEdit,
  faEllipsis,
  faPowerOff,
  faTrash,
  faNetworkWired,
  faCircle,
  faCheck,
} from '@fortawesome/free-solid-svg-icons'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  pifs: XoPif[]
}>()

const { get, isReady, hasError } = useNetworkStore().subscribe()
const { t } = useI18n()

const pagination = ref<PaginationPayload>({
  currentPage: 1,
  pageSize: 10,
  startIndex: 0,
  endIndex: 0,
})

const selectedPifId = useRouteQuery('id')

const findPageById = () => {
  const index = props.pifs.findIndex(pif => pif.id === selectedPifId.value)
  if (index === -1) return null
  pagination.value.currentPage = Math.floor(index / pagination.value.pageSize) + 1
}
watch(
  () => props.pifs,
  () => {
    findPageById()
  }
)

const getNetwork = (pif: XoPif) => {
  return get(pif.$network)!
}

const getNetworkName = (pif: XoPif) => {
  const network = getNetwork(pif)
  return network.name_label ? network.name_label : ''
}

const getVlan = (vlan: XoPif['vlan']) => (vlan === -1 ? '' : vlan)

const searchQuery = ref('')

const filteredPifs = computed(() => {
  let filtered = props.pifs
  if (!searchQuery.value) return props.pifs.slice(pagination.value.startIndex - 1, pagination.value.endIndex)
  filtered = props.pifs.filter(pif =>
    Object.values(pif).some(value => String(value).toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
  return filtered.slice(pagination.value.startIndex - 1, pagination.value.endIndex)
})

const usableIds = computed(() => props.pifs.map(item => item.id))
const { selected, areAllSelected } = useMultiSelect(usableIds)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? usableIds.value : []
}

const { visibleColumns, rows } = useTable('pifs', filteredPifs, {
  rowId: record => record.id,
  columns: define => [
    define('checkbox', () => '', { label: '', isHideable: false }),
    define('network', record => getNetworkName(record), { label: t('network') }),
    define('device', record => record.device, { label: t('device') }),
    define('status', () => '', { label: t('status') }),
    define('vlan', record => getVlan(record.vlan), { label: t('vlan') }),
    define('ip', record => record.ip, { label: t('ip-addresses') }),
    define('mac', record => record.mac, { label: t('mac-addresses') }),
    define('mode', record => record.mode, { label: t('ip-mode') }),
    define('more', () => '', { label: '', isHideable: false }),
  ],
})

type pifHeader = 'network' | 'device' | 'status' | 'vlan' | 'ip' | 'mac' | 'mode' | 'more'

const headerIcon: Record<pifHeader, IconDefinition> = {
  network: faAlignLeft,
  device: faAlignLeft,
  status: faPowerOff,
  vlan: faAlignLeft,
  ip: faAt,
  mac: faAt,
  mode: faCaretDown,
  more: faEllipsis,
}
</script>

<style scoped lang="postcss">
.pif-table {
  .table-actions {
    margin-top: 2.4rem;
    display: flex;
    flex-direction: column;
  }

  .selection {
    margin: 0.8rem 0;
    display: flex;
    justify-content: space-between;
  }

  .table-container {
    overflow-x: auto;

    .icon {
      margin-right: 0.8rem;
    }

    .checkbox,
    .more {
      width: 4.5rem;
    }

    :deep(.col-vlan) {
      width: 8.5rem;
    }

    :deep(.col-network, .col-status, .col-ip, .col-mac),
    :deep(.col-status),
    :deep(.col-ip),
    :deep(.col-mac) {
      width: 20rem;
    }

    :deep(.col-device),
    :deep(.col-mode) {
      width: 11rem;
    }

    tr:last-child {
      border-bottom: 0.1rem solid var(--color-neutral-border);
    }

    td {
      padding: 1.1rem;
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
}
</style>
