import type { FrontXoVmBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import type { XoBackupJobSettings } from '@/modules/backup/types/xo-backup.ts'

export function getVmBackupJobSettings(job: FrontXoVmBackupJob): XoBackupJobSettings {
  if (!job.settings['']) {
    return {}
  }

  const {
    preferNbd,
    cbtDestroySnapshotData,
    concurrency,
    nbdConcurrency,
    maxExportRate,
    nRetriesVmBackupFailures,
    hideSuccessfulItems,
    backupReportTpl,
    reportWhen,
    timeout,
    checkpointSnapshot,
    offlineBackup,
    offlineSnapshot,
    mergeBackupsSynchronously,
    timezone,
    reportRecipients,
    ...other
  } = job.settings['']

  return {
    compression: job.compression,
    proxy: job.proxy,
    preferNbd,
    cbtDestroySnapshotData,
    concurrency,
    nbdConcurrency,
    maxExportRate,
    nRetriesVmBackupFailures,
    hideSuccessfulItems,
    backupReportTpl,
    reportWhen,
    timeout,
    checkpointSnapshot,
    offlineBackup,
    offlineSnapshot,
    mergeBackupsSynchronously,
    timezone,
    reportRecipients,
    other,
  }
}
