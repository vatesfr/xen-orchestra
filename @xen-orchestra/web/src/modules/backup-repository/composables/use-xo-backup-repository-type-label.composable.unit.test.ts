import { useXoBackupRepositoryTypeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-label.composable.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { type MaybeRefOrGetter, ref } from 'vue'
import { BACKUP_REPOSITORY_TYPE, type BackupRepositoryType } from 'xo-remote-parser'

function mountTypeLabel(type: MaybeRefOrGetter<BackupRepositoryType | undefined>) {
  return mountComposableWithI18n(() => ({ typeLabel: useXoBackupRepositoryTypeLabel(type) }))
}

describe('useXoBackupRepositoryTypeLabel', () => {
  it('labels a file repository as local', () => {
    const result = mountTypeLabel(BACKUP_REPOSITORY_TYPE.FILE)

    expect(result.typeLabel).toBe(result.t('local'))
  })

  it('labels the other repositories after their own type', () => {
    const nfs = mountTypeLabel(BACKUP_REPOSITORY_TYPE.NFS)
    const smb = mountTypeLabel(BACKUP_REPOSITORY_TYPE.SMB)
    const s3 = mountTypeLabel(BACKUP_REPOSITORY_TYPE.S3)
    const azure = mountTypeLabel(BACKUP_REPOSITORY_TYPE.AZURE)
    const azurite = mountTypeLabel(BACKUP_REPOSITORY_TYPE.AZURITE)

    expect(nfs.typeLabel).toBe(nfs.t('nfs'))
    expect(smb.typeLabel).toBe(smb.t('smb'))
    expect(s3.typeLabel).toBe(s3.t('s3'))
    expect(azure.typeLabel).toBe(azure.t('azure'))
    expect(azurite.typeLabel).toBe(azurite.t('azurite'))
  })

  it('falls back to unknown when the type could not be parsed', () => {
    const result = mountTypeLabel(undefined)

    expect(result.typeLabel).toBe(result.t('unknown'))
  })

  it('reacts to changes of the source type', () => {
    const type = ref<BackupRepositoryType | undefined>(BACKUP_REPOSITORY_TYPE.NFS)
    const result = mountTypeLabel(type)

    type.value = BACKUP_REPOSITORY_TYPE.S3

    expect(result.typeLabel).toBe(result.t('s3'))
  })
})
