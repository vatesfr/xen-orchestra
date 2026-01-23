import {
  useXoBackupLogCollection,
  type FrontXoBackupLog,
} from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import type { AnyXoBackupJob } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useXoBackupJobSchedulesUtils() {
  const { t, d } = useI18n()

  const { getLastNBackupLogsByJobId } = useXoBackupLogCollection()
  const { schedulesByJobId } = useXoScheduleCollection()

  const getRunInfo = (backupLog: FrontXoBackupLog, index: number) => ({
    status: backupLog.status,
    tooltip: `${t('last-run-number', { n: index + 1 })}: ${d(backupLog.end ?? backupLog.start, 'datetime_short')}, ${t(backupLog.status)}`,
  })

  function getLastThreeRunsStatuses(backupJob: AnyXoBackupJob | undefined) {
    if (backupJob === undefined) {
      return []
    }

    return getLastNBackupLogsByJobId(backupJob.id).map((backupLog, index) => getRunInfo(backupLog, index))
  }

  function getTotalSchedules(backupJob: AnyXoBackupJob) {
    return schedulesByJobId.value.get(backupJob.id)?.length ?? 0
  }

  return {
    getLastThreeRunsStatuses,
    getTotalSchedules,
  }
}
