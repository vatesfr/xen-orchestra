import { useXoBackupRepositoryTypeLabels } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-labels.composable.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { useI18n } from 'vue-i18n'
import { BACKUP_REPOSITORY_TYPE } from 'xo-remote-parser'

describe('useXoBackupRepositoryTypeLabels', () => {
  it('labels every type of backup repository', () => {
    const result = mountComposable(() => {
      const { t } = useI18n()

      return { typeLabels: useXoBackupRepositoryTypeLabels(), t }
    }).wrapper.vm

    expect(result.typeLabels).toEqual({
      [BACKUP_REPOSITORY_TYPE.FILE]: result.t('local'),
      [BACKUP_REPOSITORY_TYPE.NFS]: result.t('nfs'),
      [BACKUP_REPOSITORY_TYPE.SMB]: result.t('smb'),
      [BACKUP_REPOSITORY_TYPE.S3]: result.t('s3'),
      [BACKUP_REPOSITORY_TYPE.AZURE]: result.t('azure'),
      [BACKUP_REPOSITORY_TYPE.AZURITE]: result.t('azurite'),
    })
  })
})
