<template>
  <div class="backup-jobs-table">
    <UiTitle>
      {{ t('backup-jobs') }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>
      <BackupJobsTable />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoBackupJobSchedulesUtils } from '@/composables/xo-backup-job-schedules.composable'
import { useXoBackupUtils } from '@/composables/xo-backup-utils.composable.ts'
import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupLogCollection } from '@/remote-resources/use-xo-backup-log-collection.ts'
import { useXoScheduleCollection } from '@/remote-resources/use-xo-schedule-collection.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useBackupJobsTable } from '@core/tables/use-backup-jobs-table'
import { logicAnd, logicOr } from '@vueuse/math'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJobs } = defineProps<{
  backupJobs: XoBackupJob[]
  hasError: boolean
}>()

const { t } = useI18n()

const { schedulesByJobId, areSchedulesReady, hasScheduleFetchError } = useXoScheduleCollection()
const { getLastNBackupLogsByJobId, areBackupLogsReady, hasBackupLogFetchError } = useXoBackupLogCollection()
const { getModeLabels } = useXoBackupUtils()

const searchQuery = ref('')

const filteredBackupJobs = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return backupJobs
  }

  return backupJobs.filter(backupJob =>
    Object.values(backupJob).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const getLastThreeRunsStatuses = (backupJob: XoBackupJob) =>
  getLastNBackupLogsByJobId(backupJob.id).map(backupLog => backupLog.status)

const getTotalSchedules = (backupJob: XoBackupJob) => schedulesByJobId.value.get(backupJob.id)?.length ?? 0

const BackupJobsTable = useBackupJobsTable(filteredBackupJobs, {
  ready: logicAnd(areSchedulesReady, areBackupLogsReady),
  error: logicOr(hasScheduleFetchError, hasBackupLogFetchError),
  empty: computed(() =>
    filteredBackupJobs.value.length > 0 ? false : searchQuery.value ? t('no-result') : t('no-backup-available')
  ),
  transform: (job: XoBackupJob) => ({
    modes: getModeLabels(job),
    lastRuns: getLastThreeRunsStatuses(job),
    totalSchedules: getTotalSchedules(job),
  }),
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
