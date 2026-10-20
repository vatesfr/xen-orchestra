import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupLogCollection } from '@/modules/backup-job/remote-resources/use-xo-backup-log-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoBackupJobLastRuns(rawBackupJob: MaybeRefOrGetter<FrontAnyXoBackupJob>) {
  const backupJob = toComputed(rawBackupJob)

  const { t, d } = useI18n()

  const { getLastNBackupLogsByJobId } = useXoBackupLogCollection()

  return computed(() =>
    getLastNBackupLogsByJobId(backupJob.value.id).map((backupLog, index) => ({
      status: backupLog.status,
      tooltip: `${t('last-run-number', { n: index + 1 })}: ${d(backupLog.end ?? backupLog.start, 'datetime_short')}, ${t(backupLog.status)}`,
    }))
  )
}
