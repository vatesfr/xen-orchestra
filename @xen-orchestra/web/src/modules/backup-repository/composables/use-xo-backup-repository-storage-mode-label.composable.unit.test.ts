import { useXoBackupRepositoryStorageModeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-storage-mode-label.composable.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { type MaybeRefOrGetter, ref } from 'vue'
import { type ParsedBackupRepositoryUrl, parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

function mountStorageModeLabel(parsedUrl: MaybeRefOrGetter<ParsedBackupRepositoryUrl | undefined>) {
  return mountComposableWithI18n(() => ({ storageModeLabel: useXoBackupRepositoryStorageModeLabel(parsedUrl) }))
}

describe('useXoBackupRepositoryStorageModeLabel', () => {
  it('labels a repository storing its backups in VHD directories as block based', () => {
    const result = mountStorageModeLabel(
      parseBackupRepositoryUrl('nfs://192.168.1.10:/exports/backups?useVhdDirectory=true')
    )

    expect(result.storageModeLabel).toBe(result.t('block-based'))
  })

  it('labels a repository storing its backups in VHD files as file based', () => {
    const result = mountStorageModeLabel(parseBackupRepositoryUrl('nfs://192.168.1.10:/exports/backups'))

    expect(result.storageModeLabel).toBe(result.t('file-based'))
  })

  it('falls back to unknown when the type could not be parsed', () => {
    const result = mountStorageModeLabel(parseBackupRepositoryUrl('ftp://192.168.1.10/backups'))

    expect(result.storageModeLabel).toBe(result.t('unknown'))
  })

  it('falls back to unknown while the url is not parsed', () => {
    const result = mountStorageModeLabel(undefined)

    expect(result.storageModeLabel).toBe(result.t('unknown'))
  })

  it('reacts to changes of the source url', () => {
    const parsedUrl = ref<ParsedBackupRepositoryUrl | undefined>(
      parseBackupRepositoryUrl('nfs://192.168.1.10:/exports/backups')
    )
    const result = mountStorageModeLabel(parsedUrl)

    parsedUrl.value = parseBackupRepositoryUrl('nfs://192.168.1.10:/exports/backups?useVhdDirectory=true')

    expect(result.storageModeLabel).toBe(result.t('block-based'))
  })
})
