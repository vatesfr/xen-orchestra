import type { FrontXoMetadataBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { XoBackupJobSettings } from '@/modules/backup-job/types/xo-backup-job-settings.type.ts'

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
