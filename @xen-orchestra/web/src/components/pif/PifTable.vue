<template>
  <div v-if="isReady" class="pif-table">
    <UiTitle type="h4" class="header">
      <slot>{{ $t('pifs') }}</slot>
      <template #actions>
        <UiButton size="medium" variant="secondary" accent="info" :left-icon="faArrowsRotate">
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
      <UiTopBottomTable
        class="selection"
        :selected-items="selected.length"
        :total-items="usableRefs.length"
        @toggle-select-all="toggleSelect"
      />
    </div>
    <div class="table-container">
      <VtsTable vertical-border class="table">
        <thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th v-if="column.id === 'checkbox'" :class="`col-${column.id}`">
                <UiCheckbox :v-model="areAllSelected" accent="info" @update:model-value="toggleSelect" />
              </th>
              <th v-else-if="column.id === 'more'" :class="`col-${column.id}`">
                <UiButtonIcon size="small" accent="info" :icon="getHeaderIcon(column.id)" />
                {{ column.label }}
              </th>
              <ColumnTitle v-else id="network" :header-class="`col-${column.id}`" :icon="getHeaderIcon(column.id)">
                {{ column.label }}
              </ColumnTitle>
            </template>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row of rows"
            :key="row.id"
            class="row"
            :class="{ selected: selectedRowId === row.id }"
            @click="selectRow(row.id)"
          >
            <td v-for="column of row.visibleColumns" :key="column.id" class="typo p2-regular">
              <UiCheckbox v-if="column.id === 'checkbox'" v-model="selected" accent="info" :value="row.id" />
              <div v-if="column.id === 'network' && getNetworkName(row.value)" class="network">
                <UiComplexIcon size="medium">
                  <VtsIcon :icon="faNetworkWired" accent="current" />
                  <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
                </UiComplexIcon>
                <p v-tooltip class="text-ellipsis">{{ getNetworkName(row.value) }}</p>
              </div>
              <div v-if="column.id === 'device'" v-tooltip class="text-ellipsis">{{ row.value.device }}</div>
              <div v-if="column.id === 'status'" v-tooltip>
                <PifStatus class="status" :pif="row.value" />
              </div>
              <div v-if="column.id === 'vlan'" v-tooltip class="text-ellipsis">
                {{ getPifData(row.value, 'vlan') }}
              </div>
              <div v-if="column.id === 'ip'" v-tooltip class="text-ellipsis">{{ row.value.ip }}</div>
              <div v-if="column.id === 'mac'" v-tooltip class="text-ellipsis">{{ row.value.mac }}</div>
              <div v-if="column.id === 'mode'" v-tooltip class="text-ellipsis">{{ getPifData(row.value, 'mode') }}</div>
              <div v-if="column.id === 'more'" v-tooltip>
                <VtsIcon accent="info" :icon="faEllipsis" />
              </div>
            </td>
          </tr>
        </tbody>
      </VtsTable>
    </div>
    <UiTopBottomTable
      class="selection"
      :selected-items="selected.length"
      :total-items="usableRefs.length"
      @toggle-select-all="toggleSelect"
    />
  </div>
</template>

<script setup lang="ts">
import PifStatus from '@/components/pif/PifStatus.vue'
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPif } from '@/types/xo/pif.type'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiActionsTitle from '@core/components/ui/actions-title/UiActionsTitle.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiComplexIcon from '@core/components/ui/complex-icon/UiComplexIcon.vue'
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
  faArrowsRotate,
  faCheck,
  faCircle,
  faEdit,
  faEllipsis,
  faNetworkWired,
  faTrash,
  faAt,
  faPowerOff,
  faCaretDown,
} from '@fortawesome/free-solid-svg-icons'
import { computed, ref } from 'vue'

const props = defineProps<{
  pifs: XoPif[]
}>()

const emit = defineEmits<{
  rowSelect: [value: XoPif['id']]
}>()

const { get, isReady } = useNetworkStore().subscribe()

const getNetworkName = (pif: XoPif) => {
  const network: XoNetwork = get(pif.$network)!
  return network.name_label ? network.name_label : ''
}

const getPifData = (pif: XoPif, type: keyof XoPif) =>
  (type === 'vlan' && pif[type] === -1) || (type === 'mode' && pif[type] === 'None') ? '' : pif[type]

const searchQuery = ref('')

const filteredPifs = computed(() => {
  if (!searchQuery.value) return props.pifs
  return props.pifs.filter(pif =>
    Object.values(pif).some(value => String(value).toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
})

const usableRefs = computed(() => props.pifs.map(item => item.id))
const { selected, areAllSelected } = useMultiSelect(usableRefs)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? usableRefs.value : []
}

const { visibleColumns, rows } = useTable('pifs', filteredPifs, {
  rowId: record => record.id,
  columns: define => [
    define('checkbox', () => '', { label: '', isHideable: false }),
    define('network', record => record.$network, { label: 'Network', isHideable: true }),
    define('device', record => record.device, { label: 'Device', isHideable: true }),
    define('status', () => '', { label: 'Status', isHideable: true }),
    define('vlan', record => record.vlan, { label: 'Vlan', isHideable: true }),
    define('ip', record => record.ip, { label: 'IP Addresses', isHideable: true }),
    define('mac', record => record.mac, { label: 'MAC address', isHideable: true }),
    define('mode', record => record.mode, { label: 'IP mode', isHideable: true }),
    define('more', () => '', { label: '', isHideable: false }),
  ],
})

type pifHeader = 'network' | 'device' | 'status' | 'vlan' | 'ip' | 'mac' | 'mode' | 'more'

const headerIcon: Record<pifHeader, { icon: IconDefinition }> = {
  network: { icon: faAlignLeft },
  device: { icon: faAlignLeft },
  status: { icon: faPowerOff },
  vlan: { icon: faAlignLeft },
  ip: { icon: faAt },
  mac: { icon: faAt },
  mode: { icon: faCaretDown },
  more: { icon: faEllipsis },
}

const getHeaderIcon = (status: pifHeader) => {
  return headerIcon[status].icon
}

const selectedRowId = ref<XoPif['id']>()

const selectRow = (rowId: XoPif['id']) => {
  selectedRowId.value = rowId
  emit('rowSelect', rowId)
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
  }

  .table-container {
    overflow-x: auto;

    .table {
      .col-checkbox,
      .col-more {
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
    }

    tr:last-child {
      border-bottom: 1px solid var(--color-neutral-border);
    }

    td {
      padding: 1.1rem;
    }

    .row {
      cursor: pointer;
    }

    .row:hover {
      background-color: var(--color-brand-background-hover);
      transition: all 0.3s ease;
    }

    .row.selected {
      background-color: var(--color-brand-background-selected);
    }

    .network {
      display: flex;
      gap: 1.6rem;
    }

    .status {
      font-size: 8.4rem !important;
    }
  }

  @media (max-width: 1500px) {
    .table-container {
      .table {
        width: 160rem;
      }
    }
  }
}
</style>
