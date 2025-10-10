<template>
  <UiCard class="backed-up-vms-table">
    <UiTitle> {{ t('backed-up-vms') }} </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTopBottomTable :selected-items="0" :total-items="0">
          <UiTablePagination v-bind="paginationBindings" />
        </UiTopBottomTable>
      </div>
      <VtsDataTable is-ready :no-data-message="backupLogs.length === 0 ? t('no-backup-available') : undefined">
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th>
                <div v-tooltip class="text-ellipsis">
                  <VtsIcon size="medium" :name="headerIcon[column.id]" />
                  {{ column.label }}
                </div>
              </th>
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
              <template v-else-if="column.id === 'total-disk-size'">
                {{ column.value?.value ? `${column.value?.value} ${column.value?.prefix}` : t('no-data') }}
              </template>
              <template v-else-if="column.id == 'nb-of-backup'">
                {{ column.value }}
              </template>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <UiTopBottomTable :selected-items="0" :total-items="0">
        <UiTablePagination v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoBackupLogsUtils } from '@/composables/xo-backup-log-utils.composable'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection'
import type { XoBackupLog } from '@/types/xo/backup-log.type'
import type { VmsSmartModeDisabled, VmsSmartModeEnabled, XoVmBackupJob } from '@/types/xo/vm-backup-job.type'
import { VM_POWER_STATE } from '@/types/xo/vm.type.ts'
import { extractIdsFromSimplePattern } from '@/utils/pattern.util'
import type { IconName } from '@core/icons'
import type { Branded } from '@core/types/utility.type'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useTable } from '@core/composables/table.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { formatSizeRaw } from '@core/utils/size.util'
import * as ValueMatcher from 'value-matcher'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backedUpVms: rawBackedUpVms, backupLogs } = defineProps<{
  backedUpVms: XoVmBackupJob['vms']
  backupLogs: XoBackupLog[]
}>()

const { t } = useI18n()

const { getVmsByIds, vms } = useXoVmCollection()
const { findTransferTask } = useXoBackupLogsUtils()

const selectedBackupJobId = useRouteQuery('id')

const searchQuery = ref('')

function checkSmartModeEnabled(
  value: VmsSmartModeEnabled | VmsSmartModeDisabled | undefined
): value is VmsSmartModeEnabled {
  if (value === undefined || typeof value !== 'object' || value === null) {
    return false
  }

  return !('id' in value)
}

function backupsLogsSize(backupLogs: XoBackupLog[]) {
  return backupLogs.reduce((totalSize, log) => {
    if (!log.tasks) {
      return totalSize
    }
    return (
      totalSize +
      log.tasks.reduce((accumulator, backup) => accumulator + (findTransferTask(backup.tasks ?? []) ?? 0), 0)
    )
  }, 0)
}

function numberOfBackups(backupLogs: XoBackupLog[]) {
  return backupLogs.reduce((accumulator, log) => accumulator + (log.tasks?.length ?? 1), 1)
}

const backedUpVms = computed(() => {
  if (checkSmartModeEnabled(rawBackedUpVms)) {
    const predicate = ValueMatcher.createPredicate(rawBackedUpVms)
    return vms.value.filter(vm => predicate(vm) && !vm.tags?.includes('xo:no-bak'))
  }
  return getVmsByIds(extractIdsFromSimplePattern(rawBackedUpVms) as Branded<'vm'>[])
})

const filteredBackedUpVms = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()
  if (!searchTerm) {
    return backedUpVms.value
  }
  return backedUpVms.value.filter(backupJob =>
    Object.values(backupJob).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const { visibleColumns, rows } = useTable('backup-jobs', filteredBackedUpVms, {
  rowId: record => record.id,
  columns: define => [
    define('vm', record => record, { label: t('vm') }),
    define('total-disk-size', () => formatSizeRaw(backupsLogsSize(backupLogs), 2), {
      label: t('total-disk-size'),
    }),
    define('nb-of-backup', () => numberOfBackups(backupLogs), {
      label: t('nb-of-backup'),
    }),
  ],
})
type BackupJobHeader = 'vm' | 'total-disk-size' | 'nb-of-backup'

const headerIcon: Record<BackupJobHeader, IconName> = {
  vm: 'fa:object',
  'total-disk-size': 'fa:hashtag',
  'nb-of-backup': 'fa:hashtag',
}

const { pageRecords: backedUpVmsRecords, paginationBindings } = usePagination('backups-jobs', rows)
</script>

<style lang="postcss" scoped>
.backed-up-vms-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.backed-up-vms-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
