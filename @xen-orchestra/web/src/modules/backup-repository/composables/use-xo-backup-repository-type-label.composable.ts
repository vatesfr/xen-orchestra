import { useMapper } from '@core/packages/mapper'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import { BACKUP_REPOSITORY_TYPE, type BackupRepositoryType } from 'xo-remote-parser'

export function useXoBackupRepositoryTypeLabel(rawType: MaybeRefOrGetter<BackupRepositoryType | undefined>) {
  const { t } = useI18n()

  return useMapper<BackupRepositoryType | 'unknown', string>(
    rawType,
    {
      [BACKUP_REPOSITORY_TYPE.FILE]: t('local'),
      [BACKUP_REPOSITORY_TYPE.NFS]: t('nfs'),
      [BACKUP_REPOSITORY_TYPE.SMB]: t('smb'),
      [BACKUP_REPOSITORY_TYPE.S3]: t('s3'),
      [BACKUP_REPOSITORY_TYPE.AZURE]: t('azure'),
      [BACKUP_REPOSITORY_TYPE.AZURITE]: t('azurite'),
      unknown: t('unknown'),
    },
    'unknown'
  )
}
