import type { FrontXoMetadataBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import type { XoBackupJobSettings } from '@/modules/backup/types/xo-backup.ts'

export function getMetadataBackupJobSettings(job: FrontXoMetadataBackupJob): XoBackupJobSettings {
  if (!job.settings['']) {
    return {}
  }

  const { hideSuccessfulItems, backupReportTpl, reportWhen, reportRecipients, ...other } = job.settings['']

  return {
    proxy: job.proxy,
    hideSuccessfulItems,
    backupReportTpl,
    reportWhen,
    reportRecipients,
    other,
  }
}
