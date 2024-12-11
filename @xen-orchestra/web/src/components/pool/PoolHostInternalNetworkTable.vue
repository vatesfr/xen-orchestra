<template>
  <div class="container">
    <UiTitle>
      {{ $t('host-internal-networks') }}
      <template #actions>
        <UiButton :left-icon="faPlus" variant="secondary" accent="info" size="medium">{{ $t('new') }}</UiButton>
      </template>
    </UiTitle>
    <div class="content">
      <UiQuerySearchBar class="table-query" @search="(value: string) => (searchQuery = value)" />
      <UiTableActions title="Table actions">
        <UiButton :left-icon="faEdit" variant="tertiary" accent="info" size="medium">{{ $t('edit') }}</UiButton>
        <UiButton :left-icon="faTrash" variant="tertiary" accent="danger" size="medium">{{ $t('delete') }}</UiButton>
      </UiTableActions>
      <UiTopBottomTable
        :selected-items="selected.length"
        :total-items="usableRefs.length"
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
                <ColumnTitle v-else id="networks" :icon="getHeaderIcon(column.id)"> {{ column.label }}</ColumnTitle>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row of rows"
              :key="row.id"
              :class="{ 'row-selected': selectedRowId === (row.value as any).id }"
              @click="selectRow(row.value, 'hostInternalNetwork')"
            >
              <td v-for="column of row.visibleColumns" :key="column.id" class="typo p2-regular">
                <UiCheckbox v-if="column.id === 'checkbox'" v-model="selected" accent="info" :value="row.id" />
                <!--             NEED TO REMOVE `as XoNetwork` -->
                <div
                  v-if="column.id === 'name_label' && (row.value as XoNetwork).name_label"
                  v-tooltip="{ placement: 'bottom-end' }"
                  class="text-ellipsis"
                >
                  {{ (row.value as XoNetwork).name_label }}
                </div>
                <div
                  v-if="column.id === 'name_description'"
                  v-tooltip="{ placement: 'bottom-end' }"
                  class="text-ellipsis"
                >
                  {{ (row.value as XoNetwork).name_description }}
                </div>
                <div v-if="column.id === 'MTU'" v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                  {{ (row.value as XoNetwork).MTU }}
                </div>
                <div
                  v-if="column.id === 'defaultIsLocked'"
                  v-tooltip="{ placement: 'bottom-end' }"
                  class="text-ellipsis"
                >
                  {{ getLockingMode((row.value as any).defaultIsLocked) }}
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
        <VtsStateHero v-if="hostInternalNetwork.length === 0" type="table" image="no-data">
          <div>{{ $t('no-network-detected') }}</div>
        </VtsStateHero>
        <VtsStateHero v-if="hasError" type="table" image="error">
          <div>{{ $t('error-no-data') }}</div>
        </VtsStateHero>
      </div>
      <UiTopBottomTable
        :selected-items="selected.length"
        :total-items="usableRefs.length"
        @toggle-select-all="toggleSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { XoNetwork } from '@/types/xo/network.type'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
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
  faEdit,
  faEllipsis,
  faHashtag,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { computed, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  hostInternalNetwork: XoNetwork[]
  isReady: boolean
  hasError: boolean
  selectedRowId: string | null
}>()

const emit = defineEmits<{
  rowSelectHostInternalNetwork: [value: any]
}>()

const { t } = useI18n()
const reactiveHostInternalNetworks = ref<XoNetwork[]>(props.hostInternalNetwork || [])

const selectRow = (item: any, table: string) => {
  emit('rowSelectHostInternalNetwork', { item, table })
}

const searchQuery = ref('')

const filteredNetworks = computed(() => {
  return searchQuery.value
    ? reactiveHostInternalNetworks.value.filter(network =>
        Object.values(network).some(value => String(value).toLowerCase().includes(searchQuery.value.toLowerCase()))
      )
    : reactiveHostInternalNetworks.value
})

const usableRefs = computed(() => reactiveHostInternalNetworks.value.map(item => item.id))

const { selected, areAllSelected } = useMultiSelect(usableRefs)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? usableRefs.value : []
}

const { visibleColumns, rows } = useTable('networks', filteredNetworks, {
  rowId: record => record.id,
  columns: define => [
    define('checkbox', () => '', { label: '', isHideable: false }),
    define('name_label', { label: 'Name', isHideable: true }),
    define('name_description', { label: 'Description', isHideable: true }),
    define('MTU', { label: 'MTU', isHideable: true }),
    define('defaultIsLocked', { label: 'Default Locking mode', isHideable: true }),
    define('more', () => '', { label: '', isHideable: false }),
  ],
})

type networkHeader = 'name_label' | 'name_description' | 'MTU' | 'defaultIsLocked' | 'more'

const headerIcon: Record<networkHeader, { icon: IconDefinition }> = {
  name_label: { icon: faAlignLeft },
  name_description: { icon: faAlignLeft },
  MTU: { icon: faHashtag },
  defaultIsLocked: { icon: faCaretDown },
  more: { icon: faEllipsis },
}

const getHeaderIcon = (status: networkHeader) => headerIcon[status].icon

const getLockingMode = (network: XoNetwork) => {
  return network.defaultIsLocked ? t('disabled') : t('unlocked')
}

watchEffect(() => {
  if (props.hostInternalNetwork) {
    reactiveHostInternalNetworks.value = props.hostInternalNetwork || []
  }
})
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
