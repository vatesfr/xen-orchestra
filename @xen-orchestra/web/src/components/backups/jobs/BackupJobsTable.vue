<template>
  <div class="backup-jobs-table">
    <UiTitle>
      {{ t('backup-jobs') }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>

      <VtsTableNew :busy :empty="emptyMessage" :error :pagination-bindings sticky="right">
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
      </VtsTableNew>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoBackupUtils } from '@/composables/xo-backup-utils.composable.ts'
import { useXoBackupLogCollection } from '@/remote-resources/use-xo-backup-log-collection'
import { useXoScheduleCollection } from '@/remote-resources/use-xo-schedule-collection'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTableNew from '@core/components/table/VtsTableNew.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useBackupJobColumns } from '@core/tables/column-sets/backup-job-columns'
import { renderLoadingCell } from '@core/tables/helpers/render-loading-cell'
import type { AnyXoBackupJob } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJobs: rawBackupJobs } = defineProps<{
  backupJobs: AnyXoBackupJob[]
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

const emptyMessage = computed(() => {
  if (rawBackupJobs.length === 0) {
    return t('no-backup-job-available')
  }

  if (filteredBackupJobs.value.length === 0) {
    return t('no-result')
  }

  return undefined
})

const { pageRecords: paginatedBackupJobs, paginationBindings } = usePagination('backups-jobs', filteredBackupJobs)

const { HeadCells, BodyCells } = useBackupJobColumns({
  body: (job: AnyXoBackupJob) => {
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
