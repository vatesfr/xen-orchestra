import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import {
  BACKUP_JOB_LAST_DAYS_COUNT,
  BACKUP_JOB_LAST_RUNS_COUNT,
  type BackupLogsStatus,
  getBackupLogsStatus,
  isBackupJobEnabled,
} from '@/modules/backup-job/utils/xo-backup-job.util.ts'
import { useXoBackupLogCollection } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { useFormSelect } from '@core/packages/form-select'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

const BACKUP_LOGS_STATUSES: BackupLogsStatus[] = ['success', 'skipped', 'failure', 'no-run']

function matchesFilter<TValue>(selectedValues: TValue[], value: TValue) {
  return selectedValues.length === 0 || selectedValues.includes(value)
}

export function useXoBackupJobFilters(rawBackupJobs: MaybeRefOrGetter<FrontAnyXoBackupJob[]>) {
  const backupJobs = toComputed(rawBackupJobs)

  const { t } = useI18n()

  const { backupLogsByJobId } = useXoBackupLogCollection()

  const { schedulesByJobId } = useXoScheduleCollection()

  const { id: statusSelectId, selectedValues: selectedStatuses } = useFormSelect(['enabled', 'disabled'] as const, {
    multiple: true,
    option: { label: status => t(status) },
  })

  const backupLogsStatusLabels = computed<Record<BackupLogsStatus, string>>(() => ({
    success: t('backups:jobs:running-good'),
    skipped: t('backups:jobs:skipped-runs'),
    failure: t('backups:jobs:errors-detected'),
    'no-run': t('no-run'),
  }))

  const { id: lastRunsStatusSelectId, selectedValues: selectedLastRunsStatuses } = useFormSelect(BACKUP_LOGS_STATUSES, {
    multiple: true,
    option: { label: status => backupLogsStatusLabels.value[status] },
  })

  const { id: lastDaysStatusSelectId, selectedValues: selectedLastDaysStatuses } = useFormSelect(BACKUP_LOGS_STATUSES, {
    multiple: true,
    option: { label: status => backupLogsStatusLabels.value[status] },
  })

  const filteredBackupJobs = computed(() => {
    const lastDaysStart = new Date()
    lastDaysStart.setDate(lastDaysStart.getDate() - BACKUP_JOB_LAST_DAYS_COUNT)
    lastDaysStart.setHours(0, 0, 0, 0)

    return backupJobs.value.filter(backupJob => {
      const isEnabled = isBackupJobEnabled(schedulesByJobId.value.get(backupJob.id) ?? [])

      const finishedBackupLogs = (backupLogsByJobId.value.get(backupJob.id) ?? []).filter(
        backupLog => backupLog.status !== 'pending'
      )

      const lastRunsStatus = getBackupLogsStatus(finishedBackupLogs.slice(0, BACKUP_JOB_LAST_RUNS_COUNT))

      const lastDaysStatus = getBackupLogsStatus(
        finishedBackupLogs.filter(backupLog => backupLog.start > lastDaysStart.getTime())
      )

      return (
        matchesFilter(selectedStatuses.value, isEnabled ? 'enabled' : 'disabled') &&
        matchesFilter(selectedLastRunsStatuses.value, lastRunsStatus) &&
        matchesFilter(selectedLastDaysStatuses.value, lastDaysStatus)
      )
    })
  })

  return { filteredBackupJobs, statusSelectId, lastRunsStatusSelectId, lastDaysStatusSelectId }
}
