import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useI18n } from 'vue-i18n'

export function useXoBackupJobModeLabel() {
  const { t } = useI18n()

  function getBackupJobModeLabel(backupJob: FrontAnyXoBackupJob) {
    if (backupJob.type === 'metadataBackup') {
      return ''
    }

    return backupJob.mode === 'delta' ? t('incremental') : t('full')
  }

  return { getBackupJobModeLabel }
}
