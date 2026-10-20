import type { FrontXoVmBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { XoBackupJobSettings } from '@/modules/backup-job/types/xo-backup-job-settings.type.ts'

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
