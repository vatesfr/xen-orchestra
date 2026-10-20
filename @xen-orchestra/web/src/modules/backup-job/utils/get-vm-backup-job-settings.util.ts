import type { FrontXoVmBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { XoBackupJobSettings } from '@/modules/backup-job/types/xo-backup-job-settings.type.ts'

export function getVmBackupJobSettings(job: FrontXoVmBackupJob): XoBackupJobSettings {
  if (!job.settings['']) {
    return {}
  }

  const {
    concurrency,
    maxExportRate,
    nRetriesVmBackupFailures,
    backupReportTpl,
    reportWhen,
    timeout,
    checkpointSnapshot,
    offlineBackup,
    offlineSnapshot,
    mergeBackupsSynchronously,
    reportRecipients,
  } = job.settings['']

  return {
    compression: job.compression,
    concurrency,
    maxExportRate,
    nRetriesVmBackupFailures,
    backupReportTpl,
    reportWhen,
    timeout,
    checkpointSnapshot,
    offlineBackup,
    offlineSnapshot,
    mergeBackupsSynchronously,
    reportRecipients,
  }
}
