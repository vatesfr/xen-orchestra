<template>
  <div class="backup-jobs-table">
    <UiTitle>
      {{ t('backup-jobs') }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>

      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="job of paginatedBackupJobs" :key="job.id" :selected="selectedBackupJobId === job.id">
            <BodyCells :item="job" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoBackupJobSchedulesUtils } from '@/modules/backup/composables/xo-backup-job-schedules-utils.composable.ts'
import { useXoBackupUtils } from '@/modules/backup/composables/xo-backup-utils.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupLogCollection } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable'
import { useBackupJobColumns } from '@core/tables/column-sets/backup-job-columns'
import { renderLoadingCell } from '@core/tables/helpers/render-loading-cell'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  backupJobs: rawBackupJobs,
  busy,
  error,
} = defineProps<{
  backupJobs: FrontAnyXoBackupJob[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const { areSchedulesReady } = useXoScheduleCollection()
const { areBackupLogsReady } = useXoBackupLogCollection()
const { getLastThreeRunsStatuses, getTotalSchedules } = useXoBackupJobSchedulesUtils()

const { getModeLabels } = useXoBackupUtils()
const selectedBackupJobId = useRouteQuery('id')

const searchQuery = ref('')

const filteredBackupJobs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return rawBackupJobs
  }

  return rawBackupJobs.filter(backupJob =>
    Object.values(backupJob).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    rawBackupJobs.length === 0
      ? t('no-backup-job-available')
      : filteredBackupJobs.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { pageRecords: paginatedBackupJobs, paginationBindings } = usePagination('backups-jobs', filteredBackupJobs)

const { HeadCells, BodyCells } = useBackupJobColumns({
  body: (job: FrontAnyXoBackupJob) => {
    const modeLabels = computed(() => getModeLabels(job))
    const lastRuns = computed(() => getLastThreeRunsStatuses(job))
    const totalSchedules = computed(() => getTotalSchedules(job))

    return {
      job: r =>
        r({
          label: job.name ?? t('untitled'),
          to: `/backup/${job.id}/runs`,
          icon: 'object:backup-job',
        }),
      mode: r => r(modeLabels.value),
      lastRuns: r => (areBackupLogsReady.value ? r(lastRuns.value) : renderLoadingCell()),
      schedules: r => (areSchedulesReady.value ? r(totalSchedules.value) : renderLoadingCell()),
      selectItem: r => r(() => (selectedBackupJobId.value = job.id)),
    }
  },
})
</script>

<style scoped lang="postcss">
.backup-jobs-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.backup-jobs-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
