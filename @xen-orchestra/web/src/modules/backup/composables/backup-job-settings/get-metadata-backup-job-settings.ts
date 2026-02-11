import type { XoBackupJobSettings } from '@/modules/backup/types/xo-backup.ts'
import type { XoMetadataBackupJob } from '@vates/types'

export function getMetadataBackupJobSettings(job: XoMetadataBackupJob): XoBackupJobSettings {
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
