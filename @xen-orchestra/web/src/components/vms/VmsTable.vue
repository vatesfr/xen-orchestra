<template>
  <div class="vms-table">
    <UiTitle>
      {{ t('vms', 2) }}
      <template #actions>
        <UiLink size="medium" href="/#/backup/new">{{ t('configure-in-xo-5') }}</UiLink>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTopBottomTable :selected-items="0" :total-items="0" @toggle-select-all="toggleSelect">
          <UiTablePagination v-if="areVmsReady" v-bind="paginationBindings" />
        </UiTopBottomTable>
      </div>
      <VtsDataTable
        :is-ready="areVmsReady"
        :has-error="hasVmFetchError"
        :no-data-message="vms.length === 0 ? t('no-vm-detected') : undefined"
      >
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th v-if="column.id === 'checkbox'" class="checkbox">
                <div v-tooltip="t('coming-soon')">
                  <UiCheckbox disabled :v-model="areAllSelected" accent="brand" @update:model-value="toggleSelect" />
                </div>
              </th>
              <th v-else-if="column.id === 'more'" class="more">
                <UiButtonIcon v-tooltip="t('coming-soon')" icon="fa:ellipsis" accent="brand" disabled size="small" />
              </th>
              <th v-else>
                <div v-tooltip class="text-ellipsis">
                  <VtsIcon accent="brand" size="medium" :name="headerIcon[column.id]" />
                  {{ column.label }}
                </div>
              </th>
            </template>
          </tr>
        </template>
        <template #tbody>
          <tr
            v-for="row of vmsRecords"
            :key="row.id"
            :class="{ selected: selectedVmId === row.id }"
            @click="selectedVmId = row.id"
          >
            <td
              v-for="column of row.visibleColumns"
              :key="column.id"
              class="typo-body-regular-small"
              :class="{ checkbox: column.id === 'checkbox' }"
            >
              <div v-if="column.id === 'checkbox'" v-tooltip="t('coming-soon')">
                <UiCheckbox disabled accent="brand" :value="row.id" />
              </div>
              <UiButtonIcon
                v-else-if="column.id === 'more'"
                v-tooltip="t('coming-soon')"
                icon="fa:ellipsis"
                accent="brand"
                disabled
                size="small"
              />
              <div v-else-if="column.id === 'name_label'" v-tooltip class="text-ellipsis">
                <UiLink size="medium" icon="fa:desktop" :to="`/vm/${row.id}`" @click.stop>
                  {{ column.value }}
                </UiLink>
              </div>
              <div
                v-else-if="column.id === 'addresses'"
                v-tooltip="[column.value].filter(Boolean).join(', ')"
                class="ip-addresses"
              >
                <span class="text-ellipsis">{{ column.value[0] }}</span>
                <span v-if="column.value.length > 1" class="typo-body-regular-small more-ips">
                  {{ `+${column.value.length - 1}` }}
                </span>
              </div>
              <div
                v-else-if="column.id === 'CPUs' || column.id === 'memory' || column.id === 'disk-space'"
                class="number"
              >
                {{ column.id === 'CPUs' ? column.value : `${column.value?.value} ${column.value?.prefix}` }}
              </div>
              <div v-else-if="column.id === 'tags'">
                <UiTagsList v-if="column.value.length > 0">
                  <UiTag v-for="tag in column.value" :key="tag" accent="info" variant="secondary">
                    {{ tag }}
                  </UiTag>
                </UiTagsList>
              </div>
              <div v-else v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">
                {{ column.value }}
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <VtsStateHero v-if="searchQuery && filteredVms.length === 0" format="table" type="no-result" size="medium">
        {{ t('no-result') }}
      </VtsStateHero>
      <UiTopBottomTable :selected-items="0" :total-items="0" @toggle-select-all="toggleSelect">
        <UiTablePagination v-if="areVmsReady" v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoVmUtils } from '@/composables/xo-vm-utils.composable.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import type { XoVm } from '@/types/xo/vm.type.ts'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import useMultiSelect from '@core/composables/table/multi-select.composable.ts'
import { useTable } from '@core/composables/table.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { type IconName } from '@core/icons'
import { noop } from '@vueuse/shared'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vms } = defineProps<{
  vms: XoVm[]
}>()

const { t } = useI18n()

const { getRam, getIpAddresses, getDiskSpace } = useXoVmUtils()

const { areVmsReady, hasVmFetchError } = useXoVmCollection()

const selectedVmId = useRouteQuery('id')

const searchQuery = ref('')

const filteredVms = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return vms
  }

  return vms.filter(vm => Object.values(vm).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})

const vmIds = computed(() => vms.map(vm => vm.id))

const { selected, areAllSelected } = useMultiSelect(vmIds)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? vmIds.value : []
}

const { visibleColumns, rows } = useTable('vms', filteredVms, {
  rowId: record => record.id,
  columns: define => [
    define('checkbox', noop, { label: '', isHideable: false }),
    define('name_label', record => record.name_label, { label: t('vm') }),
    define('addresses', record => getIpAddresses(record), { label: t('ip-addresses') }),
    define('CPUs', record => record.CPUs.number, { label: t('cpus') }),
    define('memory', record => getRam(record), { label: t('ram') }),
    define('disk-space', record => getDiskSpace(record), { label: t('disk-space') }),
    define('tags', { label: t('tags') }),
    define('more', noop, { label: '', isHideable: false }),
  ],
})

const { pageRecords: vmsRecords, paginationBindings } = usePagination('vms', rows)

type VmHeader = 'name_label' | 'addresses' | 'CPUs' | 'memory' | 'disk-space' | 'tags'

const headerIcon: Record<VmHeader, IconName> = {
  name_label: 'fa:align-left',
  addresses: 'fa:at',
  CPUs: 'fa:hashtag',
  memory: 'fa:hashtag',
  'disk-space': 'fa:hashtag',
  tags: 'fa:square-caret-down',
}
</script>

<style scoped lang="postcss">
.vms-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.vms-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
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

  .number {
    text-align: right;
  }
}
</style>
