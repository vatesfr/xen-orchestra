import type { BackupRepositoryType } from '@/modules/backup/utils/xo-backup-repository-url.util.ts'
import { useI18n } from 'vue-i18n'

export function useXoBackupRepositoryUtils() {
  const { t } = useI18n()

  function getTypeLabel(type: BackupRepositoryType | undefined): string {
    switch (type) {
      case 'file':
        return t('local')
      case 'nfs':
        return t('nfs')
      case 'smb':
        return t('smb')
      case 's3':
        return t('s3')
      case 'azure':
        return t('azure')
      case 'azurite':
        return t('azurite')
      default:
        return ''
    }
  }

  return { getTypeLabel }
}
