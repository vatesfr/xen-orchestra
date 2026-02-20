import type { FrontXoMirrorBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import type { XoBackupJobSettings } from '@/modules/backup/types/xo-backup.ts'

export function getMirrorBackupJobSettings(job: FrontXoMirrorBackupJob): XoBackupJobSettings {
  if (!job.settings['']) {
    return {}
  }

  const {
    concurrency,
    maxExportRate,
    nRetriesVmBackupFailures,
    hideSuccessfulItems,
    backupReportTpl,
    reportWhen,
    timeout,
    reportRecipients,
    mergeBackupsSynchronously,
    ...other
  } = job.settings['']

  return {
    proxy: job.proxy,
    concurrency,
    maxExportRate,
    nRetriesVmBackupFailures,
    hideSuccessfulItems,
    backupReportTpl,
    reportWhen,
    timeout,
    reportRecipients,
    mergeBackupsSynchronously,
    other,
  }
}
