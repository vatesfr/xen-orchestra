import type { BackupJobSettings } from '@/composables/xo-backup-job/types.ts'
import type { XoMirrorBackupJob } from '@vates/types'

export function getMirrorBackupJobSettings(job: XoMirrorBackupJob): BackupJobSettings {
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
