<template>
  <div class="backup-logs-table">
    <UiTitle>
      {{ t('runs') }}
      <template #actions>
        <UiLink size="medium" href="/#/backup/new">{{ t('configure-in-xo-5') }}</UiLink>
      </template>
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTopBottomTable :selected-items="0" :total-items="0">
          <UiTablePagination v-bind="paginationBindings" />
        </UiTopBottomTable>
      </div>
      <VtsDataTable
        is-ready
        :has-error
        :no-data-message="backupLogs.length === 0 ? t('no-backup-run-available') : undefined"
      >
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th v-if="column.id === 'checkbox'" class="checkbox">
                <div v-tooltip="t('coming-soon')">
                  <UiCheckbox disabled accent="brand" />
                </div>
              </th>
              <th v-else-if="column.id === 'more'" class="more">
                <UiButtonIcon v-tooltip="t('coming-soon')" icon="fa:ellipsis" accent="brand" disabled size="small" />
              </th>
              <th v-else>
                <div v-tooltip class="text-ellipsis">
                  <VtsIcon size="medium" :name="headerIcon[column.id]" />
                  {{ column.label }}
                </div>
              </th>
            </template>
          </tr>
        </template>
        <template #tbody>
          <tr
            v-for="row of backupLogsRecords"
            :key="row.id"
            :class="{ selected: selectedBackupLogId === row.id }"
            @click="selectedBackupLogId = row.id"
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
              <div v-else-if="['start-date', 'end-date', 'duration'].includes(column.id)" class="number">
                {{ column.value }}
              </div>
              <template v-else-if="column.id === 'status'">
                <VtsBackupState :state="column.value" />
              </template>
              <div v-else-if="column.id === 'transfer-size'" class="number">
                {{ column.value?.value }} {{ column.value?.prefix }}
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <VtsStateHero v-if="searchQuery && filteredBackupLogs.length === 0" format="table" type="no-result" size="small">
        {{ t('no-result') }}
      </VtsStateHero>
      <UiTopBottomTable :selected-items="0" :total-items="0">
        <UiTablePagination v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoBackupLogsUtils } from '@/composables/xo-backup-log-utils.composable'
import type { XoBackupLog } from '@/types/xo/backup-log.type.ts'
import type { IconName } from '@core/icons'
import VtsBackupState from '@core/components/backup-state/VtsBackupState.vue'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTable } from '@core/composables/table.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { noop } from '@vueuse/shared'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupLogs } = defineProps<{
  backupLogs: XoBackupLog[]
  hasError: boolean
}>()

const { t } = useI18n()

const selectedBackupLogId = useRouteQuery('id')

const searchQuery = ref('')

const filteredBackupLogs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return backupLogs
  }

  return backupLogs.filter(backupLog =>
    Object.values(backupLog).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const { getBackupLogDate, getBackupLogDuration, getTransferSize } = useXoBackupLogsUtils()

const { visibleColumns, rows } = useTable('backup-logs', filteredBackupLogs, {
  rowId: record => record.id,
  columns: define => [
    define('checkbox', noop, { label: '', isHideable: false }),
    define('start-date', record => getBackupLogDate(record.start), { label: t('start-date') }),
    define('end-date', record => getBackupLogDate(record.end), { label: t('end-date') }),
    define('duration', record => getBackupLogDuration(record), { label: t('duration') }),
    define('status', record => record.status, { label: t('status') }),
    define('transfer-size', record => getTransferSize(record), { label: t('transfer-size') }),
    define('more', noop, { label: '', isHideable: false }),
  ],
})

const { pageRecords: backupLogsRecords, paginationBindings } = usePagination('backups-logs', rows)

type BackupLogHeader = 'start-date' | 'end-date' | 'duration' | 'status' | 'transfer-size'

const headerIcon: Record<BackupLogHeader, IconName> = {
  'start-date': 'fa:date',
  'end-date': 'fa:date',
  duration: 'fa:time',
  status: 'fa:square-caret-down',
  'transfer-size': 'fa:hashtag',
}
</script>

<style scoped lang="postcss">
.backup-logs-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.backup-logs-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
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
