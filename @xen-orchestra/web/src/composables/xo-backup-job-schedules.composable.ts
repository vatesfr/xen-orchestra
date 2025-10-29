import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupLogCollection } from '@/remote-resources/use-xo-backup-log-collection'
import { useXoScheduleCollection } from '@/remote-resources/use-xo-schedule-collection'
import type { XoBackupLog } from '@/types/xo/backup-log.type'
import type { IconName } from '@core/icons'
import { createMapper } from '@core/packages/mapper'
import { useI18n } from 'vue-i18n'

export function useXoBackupJobSchedules() {
  const { t } = useI18n()

  const { getLastNBackupLogsByJobId } = useXoBackupLogCollection()
  const { schedulesByJobId } = useXoScheduleCollection()

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

  function getLastThreeRunsStatuses(backupJob: XoBackupJob | undefined) {
    if (backupJob === undefined) {
      return []
    }

    return getLastNBackupLogsByJobId(backupJob.id).map((backupLog, index) => getRunInfo(backupLog, index))
  }

  function getTotalSchedules(backupJob: XoBackupJob) {
    return schedulesByJobId.value.get(backupJob.id)?.length ?? 0
  }

  return {
    getLastThreeRunsStatuses,
    getTotalSchedules,
  }
}
