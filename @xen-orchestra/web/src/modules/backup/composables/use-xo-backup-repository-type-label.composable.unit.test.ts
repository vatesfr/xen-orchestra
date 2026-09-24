import { useXoBackupRepositoryTypeLabel } from '@/modules/backup/composables/use-xo-backup-repository-type-label.composable.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { BACKUP_REPOSITORY_TYPE, type BackupRepositoryType } from 'xo-remote-parser'

function mountTypeLabel(type: BackupRepositoryType | undefined) {
  return mountComposable(() => {
    const { t } = useI18n()

    return { typeLabel: useXoBackupRepositoryTypeLabel(type), t }
  }).wrapper.vm
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
    const { wrapper } = mountComposable(() => {
      const { t } = useI18n()

      return { typeLabel: useXoBackupRepositoryTypeLabel(type), t }
    })

    type.value = BACKUP_REPOSITORY_TYPE.S3

    expect(wrapper.vm.typeLabel).toBe(wrapper.vm.t('s3'))
  })
})
