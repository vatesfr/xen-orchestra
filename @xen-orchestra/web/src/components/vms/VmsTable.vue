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
          <UiTablePagination v-if="isReady" v-bind="paginationBindings" />
        </UiTopBottomTable>
      </div>
      <VtsDataTable :is-ready :has-error :no-data-message="vms.length === 0 ? t('no-vm-detected') : undefined">
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th>
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
            <td v-for="column of row.visibleColumns" :key="column.id" class="typo-body-regular-small">
              <div v-if="column.id === 'name_label'" v-tooltip class="text-ellipsis">
                <UiLink size="medium" icon="fa:desktop" :to="`/vm/${row.id}/dashboard`" @click.stop>
                  {{ column.value }}
                </UiLink>
              </div>
              <div
                v-else-if="column.id === 'ip-addresses'"
                v-tooltip="column.value.length > 1 ? column.value.join(', ') : undefined"
                class="ip-addresses"
              >
                <span v-tooltip="column.value.length === 1" class="text-ellipsis">{{ column.value[0] }}</span>
                <span v-if="column.value.length > 1" class="typo-body-regular-small more-info">
                  {{ `+${column.value.length - 1}` }}
                </span>
              </div>
              <div
                v-else-if="column.id === 'CPUs' || column.id === 'memory' || column.id === 'disk-space'"
                class="number"
              >
                {{ column.id === 'CPUs' ? column.value : `${column.value?.value} ${column.value?.prefix}` }}
              </div>
              <div v-else-if="column.id === 'tags'" v-tooltip="[column.value].filter(Boolean).join(', ')" class="tags">
                <div v-if="column.value.length > 0" class="text-ellipsis">
                  <UiTagsList nowrap>
                    <UiTag v-for="tag in column.value.slice(0, 2)" :key="tag" accent="info" variant="secondary">
                      {{ tag }}
                    </UiTag>
                  </UiTagsList>
                </div>
                <div v-if="column.value.length > 2" class="typo-body-regular-small more-info">
                  {{ `+${column.value.length - 2}` }}
                </div>
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <VtsStateHero v-if="searchQuery && filteredVms.length === 0" format="table" type="no-result" size="medium">
        {{ t('no-result') }}
      </VtsStateHero>
      <UiTopBottomTable :selected-items="0" :total-items="0" @toggle-select-all="toggleSelect">
        <UiTablePagination v-if="isReady" v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoVbdCollection } from '@/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiCollection } from '@/remote-resources/use-xo-vdi-collection.ts'
import { getVmIpAddresses, getVmRam } from '@/utils/xo-records/vm.util.ts'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
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
import { formatSizeRaw } from '@core/utils/size.util.ts'
import type { XoVbd, XoVdi, XoVm } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vms } = defineProps<{
  vms: XoVm[]
  isReady: boolean
  hasError: boolean
}>()

const { getVbdById } = useXoVbdCollection()
const { getVdiById } = useXoVdiCollection()

const { t } = useI18n()

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

const { selected } = useMultiSelect(vmIds)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? vmIds.value : []
}

const getDiskSpace = (vm: XoVm) => {
  const vdis = [...vm.$VBDs].map(vbdId => getVbdById(vbdId as XoVbd['id'])?.VDI)

  const totalSize = vdis.map(vdiId => getVdiById(vdiId as XoVdi['id'])?.size || 0).reduce((sum, size) => sum + size, 0)

  return formatSizeRaw(totalSize, 1)
}

const { visibleColumns, rows } = useTable('vms', filteredVms, {
  rowId: record => record.id,
  columns: define => [
    define('name_label', record => record.name_label, { label: t('vm') }),
    define('ip-addresses', record => getVmIpAddresses(record), { label: t('ip-addresses') }),
    define('CPUs', record => record.CPUs.number, { label: t('vcpus') }),
    define('memory', record => getVmRam(record), { label: t('ram') }),
    define('disk-space', record => getDiskSpace(record), { label: t('disk-space') }),
    define('tags', record => record.tags, { label: t('tags') }),
  ],
})

const { pageRecords: vmsRecords, paginationBindings } = usePagination('vms', rows)

type VmHeader = 'name_label' | 'ip-addresses' | 'CPUs' | 'memory' | 'disk-space' | 'tags'

const headerIcon: Record<VmHeader, IconName> = {
  name_label: 'fa:a',
  'ip-addresses': 'fa:at',
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

  .ip-addresses,
  .tags {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.8rem;

    .more-info {
      color: var(--color-neutral-txt-secondary);
    }
  }

  .number {
    text-align: right;
  }
}
</style>
