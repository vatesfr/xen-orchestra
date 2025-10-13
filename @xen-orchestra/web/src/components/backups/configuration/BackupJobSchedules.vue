<template>
  <UiCard class="backup-jobs-schedules">
    <UiTitle> {{ t('schedules') }} </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTopBottomTable :selected-items="0" :total-items="0">
          <UiTablePagination v-bind="paginationBindings" />
        </UiTopBottomTable>
      </div>
      <VtsDataTable is-ready :no-data-message="backupJobsSchedules.length === 0 ? t('no-backup-available') : undefined">
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th v-if="column.id === 'checkbox'" class="checkbox">
                <div v-tooltip="t('coming-soon')">
                  <UiCheckbox disabled accent="brand" />
                </div>
              </th>
              <th v-else-if="column.id === 'more'">
                <UiButtonIcon v-tooltip="t('coming-soon')" icon="fa:ellipsis" accent="brand" disabled size="small" />
              </th>
              <th v-else>
                <div v-tooltip>
                  <VtsIcon size="medium" :name="headerIcon[column.id]" />
                  {{ column.label }}
                </div>
              </th>
            </template>
          </tr>
        </template>
        <template #tbody>
          <tr v-for="row of backupJobsRecords" :key="row.id" :class="{ selected: selectedBackupJobId === row.id }">
            <td v-for="column of row.visibleColumns" :key="column.id" :class="{ checkbox: column.id === 'checkbox' }">
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
              <div v-else-if="column.id === 'schedule'">
                <UiLink size="medium" icon="object:backup-job" :href="`/#/backup/${column.value.jobId}/edit`">
                  {{ column.value.name }}
                </UiLink>
              </div>
              <template v-else-if="column.id === 'status'">
                <VtsEnabledState :enabled="column.value ?? false" />
              </template>
              <template v-else-if="column.id === 'last-runs'">
                <ul class="last-three-runs">
                  <li v-for="(status, index) in column.value" :key="index" v-tooltip="status.tooltip">
                    <VtsIcon size="medium" :name="status.icon" />
                    <span class="visually-hidden">{{ t('last-run-number', { n: index + 1 }) }}</span>
                  </li>
                </ul>
              </template>
              <div v-else v-tooltip class="text-ellipsis">
                {{ column.value }}
              </div>
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
import { useXoBackupLogCollection } from '@/remote-resources/use-xo-backup-log-collection'
import type { XoBackupLog } from '@/types/xo/backup-log.type'
import type { XoSchedule } from '@/types/xo/schedule.type'
import type { IconName } from '@core/icons'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useTable } from '@core/composables/table.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { createMapper } from '@core/packages/mapper'
import { noop } from '@vueuse/shared'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJobsSchedules } = defineProps<{
  backupJobsSchedules: XoSchedule[]
}>()

const { t } = useI18n()

const { getLastNBackupLogsByJobId } = useXoBackupLogCollection()

const selectedBackupJobId = useRouteQuery('id')

const searchQuery = ref('')

const filteredBackupJobs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  let filteredSchedules: XoSchedule[]
  if (!searchTerm) {
    filteredSchedules = backupJobsSchedules
  }

  filteredSchedules = backupJobsSchedules.filter(schedules =>
    Object.values(schedules).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )

  return filteredSchedules
})

const getRunStatusIcon = createMapper<XoBackupLog['status'], IconName>(
  {
    success: 'legacy:status:success',
    skipped: 'legacy:status:warning',
    interrupted: 'legacy:status:danger',
    failure: 'legacy:status:danger',
    pending: 'legacy:status:info',
  },
  'failure'
)

const getRunInfo = (backupLog: XoBackupLog, index: number) => ({
  icon: getRunStatusIcon(backupLog.status),
  tooltip: `${t('last-run-number', { n: index + 1 })}: ${new Date(backupLog.end ?? backupLog.start).toLocaleString()}, ${t(backupLog.status)}`,
})

const getLastThreeRunsStatuses = (backupJob: XoSchedule) =>
  getLastNBackupLogsByJobId(backupJob.jobId).map((backupLog, index) => getRunInfo(backupLog, index))

const { visibleColumns, rows } = useTable('backup-jobs', filteredBackupJobs, {
  rowId: record => record.id,
  columns: define => [
    define('checkbox', noop, { label: '', isHideable: false }),
    define('schedule', record => record, { label: t('schedule') }),
    define('id', record => record.id, { label: t('id') }),
    define('status', record => record.enabled, { label: t('status') }),
    define('cron-pattern', record => record.cron, { label: t('cron-pattern') }),
    define('last-runs', record => getLastThreeRunsStatuses(record), {
      label: t('last-n-runs', { n: 3 }),
    }),
    // define('next-run', () => 'comming soon', { label: t('next-run') }), // #TODO bad data
    define('more', noop, { label: '', isHideable: false }),
  ],
})

const { pageRecords: backupJobsRecords, paginationBindings } = usePagination('backups-jobs', rows)

type BackupJobHeader = 'id' | 'schedule' | 'cron-pattern' | 'status' | 'last-runs'

const headerIcon: Record<BackupJobHeader, IconName> = {
  id: 'fa:hashtag',
  schedule: 'fa:align-left',
  'cron-pattern': 'fa:clock',
  status: 'fa:square-caret-down',
  'last-runs': 'fa:square-caret-down',
  // 'next-run': 'fa:calendar',
}
</script>

<style lang="postcss" scoped>
.backup-jobs-schedules,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.backup-jobs-schedules {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }

  .more {
    width: 4.8rem;
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
}
</style>
