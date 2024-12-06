<template>
  <div class="host-pif-table">
    <UiTitle>
      {{ $t('pifs') }}
      <template #actions>
        <UiButton
          v-tooltip="$t('coming-soon')"
          disabled
          :left-icon="faPlus"
          variant="secondary"
          accent="info"
          size="medium"
        >
          {{ $t('scan-pifs') }}
        </UiButton>
      </template>
    </UiTitle>
    <div class="container">
      <UiQuerySearchBar class="table-query" @search="(value: string) => (searchQuery = value)" />
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
        :total-items="pifsUuids.length"
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
                <UiCheckbox v-if="column.id === 'checkbox'" v-model="selected" accent="info" :value="row.id" />
                <VtsIcon v-else-if="column.id === 'more'" accent="info" :icon="faEllipsis" />
                <div v-else-if="column.id === 'status'" v-tooltip>
                  <HostPifStatus class="status" :pif-status="column.value" />
                </div>
                <div v-else-if="column.id === 'network'" class="network">
                  <UiComplexIcon size="medium" class="icon">
                    <VtsIcon :icon="faNetworkWired" accent="current" />
                    <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
                  </UiComplexIcon>
                  <a v-tooltip href="" class="text-ellipsis name">{{ column.value }}</a>
                </div>
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
        :total-items="pifsUuids.length"
        @toggle-select-all="toggleSelect"
      />
    </div>
  </div>
  <UiCardSpinner v-if="!isReady" />
</template>

<script lang="ts" setup>
import HostPifStatus from '@/components/host/network/HostPifStatus.vue'
import UiCardSpinner from '@/components/ui/UiCardSpinner.vue'
import useMultiSelect from '@/composables/multi-select.composable'
import type { XenApiNetwork, XenApiPif } from '@/libs/xen-api/xen-api.types'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiComplexIcon from '@core/components/ui/complex-icon/UiComplexIcon.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { useTable } from '@core/composables/table.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import {
  faAlignLeft,
  faAt,
  faCaretDown,
  faCheck,
  faCircle,
  faEdit,
  faEllipsis,
  faNetworkWired,
  faPlus,
  faPowerOff,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { pifs } = defineProps<{
  pifs: XenApiPif[]
  isReady: boolean
}>()

const { t } = useI18n()

const { getByOpaqueRef } = useNetworkStore().subscribe()

const getNetworkName = (pif: string) => {
  const network: XenApiNetwork = getByOpaqueRef(pif as XenApiNetwork['$ref'])!
  return network?.name_label ? network.name_label : ''
}

const getVlanData = (vlan: number) => {
  return vlan !== -1 ? vlan : t('none')
}

const searchQuery = ref('')

const filteredNetworks = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()
  if (!searchTerm) {
    return pifs
  }
  return pifs.filter(pif => Object.values(pif).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})

const pifsUuids = computed(() => pifs.map(pif => pif.uuid))

const { selected, areAllSelected } = useMultiSelect(pifsUuids)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? pifsUuids.value : []
}

const { visibleColumns, rows } = useTable('pifs', filteredNetworks, {
  rowId: record => record.uuid,
  columns: define => [
    define('checkbox', () => '', { label: '', isHideable: false }),
    define('network', record => getNetworkName(record.network), { label: 'Network', isHideable: true }),
    define('device', { label: 'Device', isHideable: true }),
    define('status', record => record.currently_attached, { label: 'Status', isHideable: true }),
    define('VLAN', record => getVlanData(record.VLAN), { label: 'Vlan', isHideable: true }),
    define('IP', { label: 'IP', isHideable: true }),
    define('MAC', { label: 'MAC', isHideable: true }),
    define('ip_configuration_mode', { label: 'Mode', isHideable: true }),
    define('more', () => '', { label: '', isHideable: false }),
  ],
})
type PifHeader = 'network' | 'device' | 'status' | 'VLAN' | 'IP' | 'MAC' | 'ip_configuration_mode' | 'more'
const headerIcon: Record<PifHeader, { icon: IconDefinition }> = {
  network: { icon: faAlignLeft },
  device: { icon: faAlignLeft },
  status: { icon: faPowerOff },
  VLAN: { icon: faAlignLeft },
  IP: { icon: faAt },
  MAC: { icon: faAt },
  ip_configuration_mode: { icon: faCaretDown },
  more: { icon: faEllipsis },
}
const getHeaderIcon = (status: PifHeader) => headerIcon[status].icon
</script>

<style scoped lang="postcss">
.host-pif-table,
.container {
  display: flex;
  flex-direction: column;
}

.host-pif-table {
  gap: 2.4rem;

  .container {
    gap: 0.8rem;

    .table {
      overflow-x: auto;

      .network {
        display: flex;
        align-items: center;
        gap: 1.8rem;
      }

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
    .table table {
      width: 160rem;
    }
  }
}
</style>
