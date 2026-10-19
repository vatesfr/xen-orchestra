import type { FrontXoMirrorBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { XoBackupJobSettings } from '@/modules/backup-job/types/xo-backup-job-settings.type.ts'

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
