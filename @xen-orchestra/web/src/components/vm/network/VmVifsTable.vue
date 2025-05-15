<template>
  <div class="vm-vifs-table">
    <UiTitle>
      {{ t('vifs') }}
      <template #actions>
        <UiButton
          v-tooltip="t('coming-soon')"
          disabled
          size="medium"
          variant="secondary"
          accent="brand"
          :left-icon="faPlus"
        >
          {{ t('new-vif') }}
        </UiButton>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
        <UiTableActions :title="t('table-actions')">
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            :left-icon="faPowerOff"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ t('change-state') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            :left-icon="faEdit"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ t('edit') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            :left-icon="faTrash"
            variant="tertiary"
            accent="danger"
            size="medium"
          >
            {{ t('delete') }}
          </UiButton>
        </UiTableActions>

        <UiTopBottomTable :selected-items="0" :total-items="0" />
      </div>
      <VtsDataTable :is-ready :has-error :no-data-message="vifs.length === 0 ? t('no-vif-detected') : undefined">
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th v-if="column.id === 'checkbox'" v-tooltip="t('coming-soon')" class="checkbox">
                <UiCheckbox :v-model="areAllSelected" accent="brand" disabled />
              </th>
              <th v-else-if="column.id === 'more'" class="more">
                <UiButtonIcon v-tooltip="t('coming-soon')" :icon="faEllipsis" accent="brand" disabled size="small" />
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
            :class="{ selected: selectedVifId === row.id }"
            @click="selectedVifId = row.id"
          >
            <td
              v-for="column of row.visibleColumns"
              :key="column.id"
              class="typo-body-regular-small"
              :class="{ checkbox: column.id === 'checkbox' }"
            >
              <div v-if="column.id === 'checkbox'" v-tooltip="t('coming-soon')">
                <UiCheckbox v-model="selected" accent="brand" :value="row.id" disabled />
              </div>
              <UiButtonIcon
                v-else-if="column.id === 'more'"
                v-tooltip="t('coming-soon')"
                :icon="faEllipsis"
                accent="brand"
                disabled
                size="small"
              />
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
                  <a v-tooltip href="" class="text-ellipsis">{{ column.value.name }}</a>
                 -->
                <span v-tooltip class="text-ellipsis">{{ column.value }}</span>
              </div>
              <div v-else-if="column.id === 'ip'" class="ip-addresses">
                <span class="text-ellipsis">{{ column.value[0] }}</span>
                <span v-if="column.value.length > 1" class="typo-body-regular-small more-ips">
                  {{ `+${column.value.length - 1}` }}
                </span>
              </div>
              <div v-else v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                {{ column.value }}
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <UiTopBottomTable :selected-items="0" :total-items="0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNetworkStore } from '@/stores/xo-rest-api/network.store.ts'
import { useVifStore } from '@/stores/xo-rest-api/vif.store.ts'
import { useVmStore } from '@/stores/xo-rest-api/vm.store.ts'
import type { XoVif } from '@/types/xo/vif.type.ts'
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
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import useMultiSelect from '@core/composables/table/multi-select.composable.ts'
import { useTable } from '@core/composables/table.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import {
  faAlignLeft,
  faAt,
  faCaretDown,
  faEdit,
  faEllipsis,
  faHashtag,
  faPlus,
  faPowerOff,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { noop } from '@vueuse/shared'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vifs } = defineProps<{
  vifs: XoVif[]
}>()

const { get: getNetwork } = useNetworkStore().subscribe()
const { get: getVm } = useVmStore().subscribe()
const { isReady, hasError } = useVifStore().subscribe()
const { t } = useI18n()

const selectedVifId = useRouteQuery('id')

const getNetworkName = (vif: XoVif) => {
  const network = getNetwork(vif.$network)

  return network?.name_label ? network.name_label : ''
}

const searchQuery = ref('')

const filteredVifs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return vifs
  }

  return vifs.filter(vif =>
    [...Object.values(vif), getNetworkName(vif)].some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const getIpAddresses = (vif: XoVif) => {
  const addresses = getVm(vif.$VM)?.addresses

  return addresses ? [...new Set(Object.values(addresses).sort())] : []
}

const vifsIds = computed(() => vifs.map(vif => vif.id))

const { selected, areAllSelected } = useMultiSelect(vifsIds)

const { visibleColumns, rows } = useTable('vifs', filteredVifs, {
  rowId: record => record.id,
  columns: define => [
    define('checkbox', noop, { label: '', isHideable: false }),
    define('network', record => getNetworkName(record), { label: t('network') }),
    define('device', record => t('vif-device', { device: record.device }), { label: t('device') }),
    define('status', record => (record.attached ? 'connected' : 'disconnected'), { label: t('status') }),
    define('ip', record => getIpAddresses(record), { label: t('ip-addresses') }),
    define('MAC', record => record.MAC, { label: t('mac-addresses') }),
    define('MTU', { label: t('mtu') }),
    define('lockingMode', { label: t('locking-mode') }),
    define('more', noop, { label: '', isHideable: false }),
  ],
})

type VifHeader = 'network' | 'device' | 'status' | 'ip' | 'MAC' | 'MTU' | 'lockingMode' | 'more'

const headerIcon: Record<VifHeader, IconDefinition> = {
  network: faAlignLeft,
  device: faAlignLeft,
  status: faPowerOff,
  ip: faAt,
  MAC: faAt,
  MTU: faHashtag,
  lockingMode: faCaretDown,
  more: faEllipsis,
}
</script>

<style scoped lang="postcss">
.vm-vifs-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .table-actions,
  .container {
    display: flex;
    flex-direction: column;
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

    .more-ips {
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
