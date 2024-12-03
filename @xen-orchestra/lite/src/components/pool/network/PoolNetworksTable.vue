<template>
  <div class="container">
    <UiTitle>
      {{ $t('networks') }}
      <template #actions>
        <UiButton :left-icon="faPlus" variant="secondary" accent="info" size="medium">{{ $t('new') }}</UiButton>
      </template>
    </UiTitle>
    <div class="content">
      <UiQuerySearchBar class="table-query" @search="(value: string) => (searchQuery = value)" />
      <UiTableActions title="Table actions">
        <UiButton :left-icon="faEdit" variant="tertiary" accent="info" size="medium">{{ $t('edit') }}</UiButton>
        <UiButton :left-icon="faCopy" variant="tertiary" accent="info" size="medium">
          {{ $t('copy-info-json') }}
        </UiButton>
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
            <tr v-for="row of rows" :key="row.id">
              <td v-for="column of row.visibleColumns" :key="column.id" class="typo p2-regular">
                <div>
                  <UiCheckbox v-if="column.id === 'checkbox'" v-model="selected" accent="info" :value="row.id" />
                </div>
                <!--             NEED TO REMOVE `as any` -->
                <div v-if="column.id === 'name_label'" v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                  {{ (row.value as any).network.name_label }}
                </div>
                <div
                  v-if="column.id === 'name_description'"
                  v-tooltip="{ placement: 'bottom-end' }"
                  class="text-ellipsis"
                >
                  {{ (row.value as any).network.name_description }}
                </div>
                <div v-if="column.id === 'status'" class="status">
                  <PoolNetworksPifStatus :pif="row.value" />
                </div>
                <div v-if="column.id === 'vlan'" v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                  {{ (row.value as any).vlan }}
                </div>
                <div v-if="column.id === 'MTU'" v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                  {{ (row.value as any).network.MTU }}
                </div>
                <div
                  v-if="column.id === 'default_locking_mode'"
                  v-tooltip="{ placement: 'bottom-end' }"
                  class="text-ellipsis"
                >
                  {{ (row.value as any).network.default_locking_mode }}
                </div>
                <div v-if="column.id === 'more'">
                  <VtsIcon accent="info" :icon="faEllipsis" />
                </div>
              </td>
            </tr>
          </tbody>
        </VtsTable>
      </div>
      <UiTopBottomTable
        :selected-items="selected.length"
        :total-items="usableRefs.length"
        @toggle-select-all="toggleSelect"
      />
    </div>
  </div>
  <UiCardSpinner v-if="!isReady" />
</template>

<script setup lang="ts">
import PoolNetworksPifStatus from '@/components/pool/network/PoolNetworksPifStatus.vue'
import UiCardSpinner from '@/components/ui/UiCardSpinner.vue'
import useMultiSelect from '@/composables/multi-select.composable'
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
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
import { computed, ref, watchEffect } from 'vue'

const props = defineProps<{
  networks: {
    network: XenApiNetwork
    status?: string
    vlan?: string
  }[]
  isReady: boolean
}>()

const reactiveNetworksWithVLANs = ref(props.networks || [])

const searchQuery = ref('')

const filteredNetworks = computed(() => {
  return searchQuery.value
    ? reactiveNetworksWithVLANs.value.filter(network =>
        Object.values(network).some(value => String(value).toLowerCase().includes(searchQuery.value.toLowerCase()))
      )
    : reactiveNetworksWithVLANs.value
})

const usableRefs = computed(() => reactiveNetworksWithVLANs.value.map(item => item.network.uuid))

const { selected, areAllSelected } = useMultiSelect(usableRefs)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? usableRefs.value : []
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

watchEffect(() => {
  if (props.networks) {
    reactiveNetworksWithVLANs.value = props.networks || []
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
