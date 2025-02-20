<template>
  <div class="host-pif-table">
    <UiTitle>
      {{ $t('pifs') }}
      <template #actions>
        <UiButton
          v-tooltip="$t('coming-soon')"
          disabled
          size="medium"
          variant="secondary"
          accent="brand"
          :left-icon="faArrowsRotate"
        >
          {{ $t('scan-pifs') }}
        </UiButton>
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
            accent="brand"
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

        <UiTopBottomTable :selected-items="0" :total-items="0" />
      </div>
      <VtsDataTable :is-ready :has-error :no-data-message="pifs.length === 0 ? $t('no-pif-detected') : undefined">
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th v-if="column.id === 'checkbox'" v-tooltip="$t('coming-soon')" class="checkbox">
                <UiCheckbox :v-model="areAllSelected" accent="brand" disabled />
              </th>
              <th v-else-if="column.id === 'more'" class="more">
                <UiButtonIcon v-tooltip="$t('coming-soon')" :icon="faEllipsis" accent="brand" disabled size="small" />
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
            :class="{ selected: selectedPifId === row.id }"
            @click="selectedPifId = row.id"
          >
            <td
              v-for="column of row.visibleColumns"
              :key="column.id"
              class="typo-body-regular-small"
              :class="{ checkbox: column.id === 'checkbox' }"
            >
              <div v-if="column.id === 'checkbox'" v-tooltip="$t('coming-soon')">
                <UiCheckbox v-model="selected" accent="brand" :value="row.id" disabled />
              </div>
              <div v-else-if="column.id === 'status'" v-tooltip>
                <VtsConnectionStatus :status="column.value" />
              </div>
              <div v-else-if="column.id === 'network'" class="network">
                <!-- TODO Remove the span when the link works and the icon is fixed -->
                <!--
                  <UiComplexIcon size="medium" class="icon">
                    <VtsIcon :icon="faNetworkWired" accent="current" />
                    <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
                  </UiComplexIcon>
                  <a v-tooltip href="" class="text-ellipsis name">{{ column.value.name }}</a>
                 -->
                <span v-tooltip class="text-ellipsis name">{{ column.value.name }}</span>
                <VtsIcon
                  v-if="column.value.management"
                  v-tooltip="$t('management')"
                  accent="warning"
                  :icon="faCircle"
                  :overlay-icon="faStar"
                />
              </div>
              <UiButtonIcon
                v-else-if="column.id === 'more'"
                v-tooltip="$t('coming-soon')"
                :icon="faEllipsis"
                accent="brand"
                disabled
                size="small"
              />
              <div v-else-if="column.id === 'ip'" class="ip-addresses">
                <span class="text-ellipsis">{{ column.value.ip }}</span>
                <span v-if="column.value.ipv6 > 0" class="typo p3-regular ipv6">{{ `+${column.value.ipv6}` }}</span>
              </div>
              <div v-else v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">{{ column.value }}</div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <UiTopBottomTable :selected-items="0" :total-items="0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoPif } from '@/types/xo/pif.type'
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
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
  faArrowsRotate,
  faAt,
  faCaretDown,
  faCircle,
  faEdit,
  faEllipsis,
  faPowerOff,
  faStar,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { noop } from '@vueuse/shared'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { pifs } = defineProps<{
  pifs: XoPif[]
}>()

const { isReady, hasError, getPifStatus } = usePifStore().subscribe()
const { get } = useNetworkStore().subscribe()

const { t } = useI18n()
const selectedPifId = useRouteQuery('id')
const searchQuery = ref('')

const filteredPifs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return pifs
  }

  return pifs.filter(pif => Object.values(pif).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})

const pifsIds = computed(() => pifs.map(pif => pif.id))

const { selected, areAllSelected } = useMultiSelect(pifsIds)

const getNetworkName = (pif: XoPif) => {
  const network = get(pif.$network)!
  return network.name_label ? network.name_label : ''
}

const getPifVlan = (pif: XoPif) => (pif.vlan !== -1 ? pif.vlan.toString() : t('none'))

const getIPv6Formatted = (pif: XoPif) => pif.ipv6.filter(ip => ip.trim() !== '').length

const getIpConfigurationMode = (ipMode: string) => {
  if (ipMode === 'Static') return t('static')
  if (ipMode === 'DHCP') return t('dhcp')
  return t('none')
}

const { visibleColumns, rows } = useTable('pifs', filteredPifs, {
  rowId: record => record.id,
  columns: define => [
    define('checkbox', noop, { label: '', isHideable: false }),
    define(
      'network',
      record => ({
        name: getNetworkName(record),
        management: record.management,
      }),
      { label: t('network') }
    ),
    define('device', record => record.device, { label: t('device') }),
    define('status', record => getPifStatus(record), { label: t('status') }),
    define('vlan', record => getPifVlan(record), { label: t('vlan') }),
    define(
      'ip',
      record => ({
        ip: record.ip,
        ipv6: getIPv6Formatted(record),
      }),
      { label: t('ip-addresses') }
    ),
    define('mac', record => record.mac, { label: t('mac-addresses') }),
    define('mode', record => getIpConfigurationMode(record.mode), { label: t('ip-mode') }),
    define('more', noop, { label: '', isHideable: false }),
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
.host-pif-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.host-pif-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }

  .network {
    display: flex;
    align-items: center;
    gap: 1.8rem;
  }

  .ip-addresses {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .ipv6 {
      color: var(--color-neutral-txt-secondary);
    }
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
