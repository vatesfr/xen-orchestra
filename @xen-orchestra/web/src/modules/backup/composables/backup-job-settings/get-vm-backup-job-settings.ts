import type { XoBackupJobSettings } from '@/modules/backup/types/xo-backup.ts'
import type { XoVmBackupJob } from '@vates/types'

export function getVmBackupJobSettings(job: XoVmBackupJob): XoBackupJobSettings {
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
