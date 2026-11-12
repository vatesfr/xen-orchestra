import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupLogCollection } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import { formatDateTime } from '@core/utils/time.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoBackupJobLastRuns(rawBackupJob: MaybeRefOrGetter<FrontAnyXoBackupJob>) {
  const backupJob = toComputed(rawBackupJob)

  const { t } = useI18n()

  const { getLastNBackupLogsByJobId } = useXoBackupLogCollection()

  return computed(() =>
    getLastNBackupLogsByJobId(backupJob.value.id).map((backupLog, index) => ({
      status: backupLog.status,
      tooltip: `${t('last-run-number', { n: index + 1 })}: ${formatDateTime(backupLog.end ?? backupLog.start)}, ${t(backupLog.status)}`,
    }))
  )
}
