<template>
  <UiCard>
    <UiTitle> {{ t('schedules') }} </UiTitle>
    <UiQuerySearchBar @search="value => (searchQuery = value)" />
    <UiTopBottomTable :selected-items="0" :total-items="0">
      <UiTablePagination v-bind="paginationBindings" />
    </UiTopBottomTable>
    <VtsDataTable is-ready :no-data-message="backupJobs.length === 0 ? t('no-backup-available') : undefined">
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
            <div v-else-if="column.id === 'id'" class="text-ellipsis">
              {{ column.value }}
            </div>
            <div v-else-if="column.id === 'cron-pattern'" v-tooltip class="text-ellipsis">
              {{ column.value }}
            </div>
            <!--
 <div v-else-if="column.id === 'next-run'">
              {{ column.value }}
            </div>
-->
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
          </td>
        </tr>
      </template>
    </VtsDataTable>
    <UiTopBottomTable :selected-items="0" :total-items="0">
      <UiTablePagination v-bind="paginationBindings" />
    </UiTopBottomTable>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupLogCollection } from '@/remote-resources/use-xo-backup-log-collection'
import { useXoScheduleCollection } from '@/remote-resources/use-xo-schedule-collection'
import type { XoBackupLog } from '@/types/xo/backup-log.type'
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

const { backupJobs } = defineProps<{
  backupJobs: XoBackupJob[]
}>()

const { t } = useI18n()

const { getLastNBackupLogsByJobId } = useXoBackupLogCollection()
const scheduleData = useXoScheduleCollection()
const selectedBackupJobId = useRouteQuery('id')

const searchQuery = ref('')

const filteredBackupJobs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  let filteredJob: XoBackupJob[]
  if (!searchTerm) {
    filteredJob = backupJobs
  }

  filteredJob = backupJobs.filter(backupJob =>
    Object.values(backupJob).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )

  const schedule = filteredJob
    .map(job => {
      return (scheduleData.schedulesByJobId.value.get(job.id) ?? []).map(schedule => {
        return { schedule, job }
      })
    })
    .flat()

  return schedule
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

const getLastThreeRunsStatuses = (backupJob: XoBackupJob) =>
  getLastNBackupLogsByJobId(backupJob.id).map((backupLog, index) => getRunInfo(backupLog, index))

const { visibleColumns, rows } = useTable('backup-jobs', filteredBackupJobs, {
  rowId: record => record.schedule.id,
  columns: define => [
    define('checkbox', noop, { label: '', isHideable: false }),
    define('schedule', record => record.schedule, { label: t('job-name') }),
    define('id', record => record.schedule.id, { label: t('id') }),
    define('status', record => record.schedule.enabled, { label: t('status') }),
    define('cron-pattern', record => record.schedule.cron, { label: t('cron-pattern') }),
    define('last-runs', record => getLastThreeRunsStatuses(record.job), {
      label: t('last-n-runs', { n: 3 }),
    }),
    // define('next-run', () => 'comming soon', { label: t('next-run') }), // #TODO bad data
    define('more', noop, { label: '', isHideable: false }),
  ],
})

const { pageRecords: backupJobsRecords, paginationBindings } = usePagination('backups-jobs', rows)

type BackupJobHeader = 'id' | 'schedule' | 'job-name' | 'cron-pattern' | 'status' | 'last-runs'

const headerIcon: Record<BackupJobHeader, IconName> = {
  id: 'fa:hashtag',
  schedule: 'fa:align-left',
  'job-name': 'fa:hashtag',
  'cron-pattern': 'fa:clock',
  status: 'fa:square-caret-down',
  'last-runs': 'fa:square-caret-down',
  // 'next-run': 'fa:caledar',
}
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
