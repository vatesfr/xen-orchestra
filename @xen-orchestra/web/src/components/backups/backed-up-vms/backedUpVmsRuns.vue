<template>
  <UiCard>
    <UiTitle> {{ t('backed-up-vms') }} </UiTitle>
    <UiQuerySearchBar @search="value => (searchQuery = value)" />
    <UiTopBottomTable :selected-items="0" :total-items="0">
      <UiTablePagination v-bind="paginationBindings" />
    </UiTopBottomTable>
    <VtsDataTable is-ready :no-data-message="backedUpVms.length === 0 ? t('no-backup-available') : undefined">
      <template #thead>
        <tr>
          <template v-for="column of visibleColumns" :key="column.id">
            <th v-if="column.id === 'disk-size'" class="checkbox" />
            <th v-else-if="column.id === 'vm'" />
          </template>
        </tr>
      </template>
      <template #tbody>
        <tr v-for="row of backedUpVmsRecords" :key="row.id" :class="{ selected: selectedBackupJobId === row.id }">
          <td v-for="column of row.visibleColumns" :key="column.id">
            <template v-if="column.id === 'vm'">
              <UiLink
                size="small"
                :icon="`object:vm:${column.value.power_state.toLocaleLowerCase() as Lowercase<VM_POWER_STATE>}`"
                :to="`/vm/${column.value.id}/dashboard`"
              >
                {{ column.value.name_label }}
              </UiLink>
            </template>
            <template v-else-if="column.id === 'disk-size'">
              {{ column.value }}
            </template>
          </td>
        </tr>
      </template>
    </VtsDataTable>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection'
import type { XoBackupLog } from '@/types/xo/backup-log.type'
import type { VmsSmartModeDisabled, VmsSmartModeEnabled, XoVmBackupJob } from '@/types/xo/vm-backup-job.type'
import { VM_POWER_STATE } from '@/types/xo/vm.type.ts'
import { extractIdsFromSimplePattern } from '@/utils/pattern.util'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useTable } from '@core/composables/table.composable'

import * as ValueMatcher from 'value-matcher'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backedUpVms: rawBackedUpVms, backupLogs } = defineProps<{
  backedUpVms: XoVmBackupJob['vms']
  backupLogs: XoBackupLog[]
}>()

const { t } = useI18n()

const searchQuery = ref('')
const { getVmsByIds, vms } = useXoVmCollection()
const selectedBackupJobId = useRouteQuery('id')

function checkSmartModeEnabled(
  value: VmsSmartModeEnabled | VmsSmartModeDisabled | undefined
): value is VmsSmartModeEnabled {
  if (value === undefined || typeof value !== 'object' || value === null) {
    return false
  }

  return !('id' in value)
}

const backedUpVms = computed(() => {
  let filteredVms = []

  if (checkSmartModeEnabled(rawBackedUpVms)) {
    const predicate = ValueMatcher.createPredicate(rawBackedUpVms)
    filteredVms = vms.value.filter(vm => predicate(vm) && !vm.tags?.includes('xo:no-bak'))
  } else {
    filteredVms = getVmsByIds(extractIdsFromSimplePattern(rawBackedUpVms) as any)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filteredVms = filteredVms.filter(vm => vm.name_label.toLowerCase().includes(query))
  }
  console.log(backupLogs)
  return filteredVms
})

const { visibleColumns, rows } = useTable('backup-jobs', backedUpVms, {
  rowId: record => record.id,
  columns: define => [
    define('vm', record => record, { label: t('vm') }),
    define('disk-size', record => record.id, { label: t('disk-size') }),
  ],
})

const { pageRecords: backedUpVmsRecords, paginationBindings } = usePagination('backups-jobs', rows)
</script>

<style lang="postcss" scoped>
th.checkbox {
  width: 4rem;
}

.last-three-runs {
  display: flex;
  gap: 0.8rem;

  li:not(:first-child) {
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      transform: scale(1.3);
    }
  }

  /* Order of selectors matters
    *  because when there is only one item, it is both the first and the last child
    *  and we want to apply the first-child style in that case
    **/
  li:last-child {
    transform: scale(0.8);

    &::after {
      transform: scale(1.6);
    }
  }

  li:first-child {
    transform: scale(1.2);
    margin-inline-end: 0.3rem;
  }
}
</style>
