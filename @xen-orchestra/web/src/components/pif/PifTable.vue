<template>
  <div class="pif-table">
    <UiTitle type="h4" class="header">
      <slot>{{ $t('pifs') }}</slot>
      <template #actions>
        <UiButton size="medium" variant="secondary" accent="info" :left-icon="faArrowsRotate">
          {{ $t('scan-pifs') }}
        </UiButton>
      </template>
    </UiTitle>
    <div class="table-container">
      <UiQuerySearchBar class="table-query" @search="(value: string) => (searchQuery = value)" />
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
      <VtsTable vertical-border class="table">
        <thead>
          <tr>
            <th v-for="column of visibleColumns" :key="column.id">
              <div v-if="column.id === 'checkbox'" class="checkbox">
                <UiCheckbox :v-model="areAllSelected" accent="info" @update:model-value="toggleSelect" />
              </div>

              <div v-else id="network" v-tooltip class="text-ellipsis">
                <VtsIcon accent="info" :icon="getHeaderIcon(column.id)" />
                {{ column.label }}
              </div>
            </th>
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
              <div v-if="column.id === 'network'" class="network">
                <UiComplexIcon size="medium">
                  <VtsIcon :icon="faNetworkWired" accent="current" />
                  <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
                </UiComplexIcon>
                <p v-tooltip class="text-ellipsis">{{ row.value.name_label }}</p>
              </div>
              <div v-if="column.id === 'device'" v-tooltip class="text-ellipsis">{{ row.value.device }}</div>
              <div v-if="column.id === 'status'" v-tooltip class="status">
                <PifStatus :pif="row.value" />
              </div>
              <div v-if="column.id === 'vlan'" v-tooltip class="text-ellipsis">{{ row.value.vlan }}</div>
              <div v-if="column.id === 'ip'" v-tooltip class="text-ellipsis">{{ row.value.ip }}</div>
              <div v-if="column.id === 'mac'" v-tooltip class="text-ellipsis">{{ row.value.mac }}</div>
              <div v-if="column.id === 'mode'" v-tooltip class="text-ellipsis">{{ row.value.mode }}</div>
              <div v-if="column.id === 'more'" v-tooltip>
                <VtsIcon accent="info" :icon="faEllipsis" />
              </div>
            </td>
          </tr>
        </tbody>
      </VtsTable>
      <UiTopBottomTable
        class="selection"
        :selected-items="selected.length"
        :total-items="usableRefs.length"
        @toggle-select-all="toggleSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import PifStatus from '@/components/pif/PifStatus.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiActionsTitle from '@core/components/ui/actions-title/UiActionsTitle.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
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
  pifs: object[]
}>()

const emit = defineEmits<{
  rowSelect: [value: string]
}>()

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
    define('checkbox', { label: '', isHideable: false }),
    define('network', { label: 'Network', isHideable: true }),
    define('device', { label: 'Device', isHideable: true }),
    define('status', { label: 'Status', isHideable: true }),
    define('vlan', { label: 'Vlan', isHideable: true }),
    define('ip', { label: 'IP Addresses', isHideable: true }),
    define('mac', { label: 'MAC address', isHideable: true }),
    define('mode', { label: 'IP mode', isHideable: true }),
    define('more', { label: '', isHideable: false }),
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

const getHeaderIcon = (status: pifHeader) => headerIcon[status].icon

const selectedRowId = ref('')

const selectRow = (rowId: string) => {
  selectedRowId.value = rowId
  emit('rowSelect', rowId)
}
</script>

<style scoped lang="postcss">
.pif-table {
  height: fit-content;
  padding: 1.6rem;
  margin: 0.8rem;
  border: solid 0.1rem var(--color-neutral-border);
  border-radius: 0.8rem;
  background-color: var(--color-neutral-background-primary);
  overflow-x: hidden;
  width: 100%;

  .table-container {
    margin-top: 2.4rem;
    overflow-x: auto;

    .table {
      width: 1600px;
    }

    tr:last-child {
      border-bottom: 1px solid var(--color-neutral-border);
    }

    th {
      width: 48px;
    }

    td {
      padding: 1.1rem;
    }

    .row {
      cursor: default;
    }

    .row:hover {
      background-color: var(--color-brand-background-hover);
    }

    .row.selected {
      background-color: var(--color-brand-background-selected);
    }

    .network {
      display: flex;
      gap: 1.6rem;
    }

    .status {
      display: flex;
      gap: 0.8rem;

      .icon {
        font-size: 1.6rem;
      }
    }

    .selection {
      margin: 0.8rem 0;
    }
  }
}
</style>
