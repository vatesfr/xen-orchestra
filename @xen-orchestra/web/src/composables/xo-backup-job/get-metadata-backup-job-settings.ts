import type { BackupJobSettings } from '@/composables/xo-backup-job/types.ts'
import type { XoMetadataBackupJob } from '@vates/types'

export function getMetadataBackupJobSettings(job: XoMetadataBackupJob): BackupJobSettings {
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
