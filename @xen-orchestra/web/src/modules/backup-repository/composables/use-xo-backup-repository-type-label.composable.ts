import { createMapper } from '@core/packages/mapper'
import { useI18n } from 'vue-i18n'
import { BACKUP_REPOSITORY_TYPE, type BackupRepositoryType } from 'xo-remote-parser'

export function useXoBackupRepositoryTypeLabel() {
  const { t } = useI18n()

  const getBackupRepositoryTypeLabel = createMapper<BackupRepositoryType | 'unknown', string>(
    () => ({
      [BACKUP_REPOSITORY_TYPE.FILE]: t('local'),
      [BACKUP_REPOSITORY_TYPE.NFS]: t('nfs'),
      [BACKUP_REPOSITORY_TYPE.SMB]: t('smb'),
      [BACKUP_REPOSITORY_TYPE.S3]: t('s3'),
      [BACKUP_REPOSITORY_TYPE.AZURE]: t('azure'),
      [BACKUP_REPOSITORY_TYPE.AZURITE]: t('azurite'),
      unknown: t('unknown'),
    }),
    'unknown'
  )

  return { getBackupRepositoryTypeLabel }
}
