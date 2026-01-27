import type { XoBackupJobSettings } from '@/modules/backup/types/xo-backup.ts'
import type { XoMirrorBackupJob } from '@vates/types'

export function getMirrorBackupJobSettings(job: XoMirrorBackupJob): XoBackupJobSettings {
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
