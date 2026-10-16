import { useMapper } from '@core/packages/mapper'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DiskFormatType, ParsedBackupRepositoryUrl } from 'xo-remote-parser'

type BackupRepositoryStorageMode = 'block' | 'file' | 'hbd' | 'unknown'

const STORAGE_MODE_BY_DISK_FORMAT: Record<DiskFormatType, BackupRepositoryStorageMode> = {
  vhd: 'file',
  vhdDirectory: 'block',
  hbd: 'hbd',
}

export function useXoBackupRepositoryStorageModeLabel(
  rawParsedUrl: MaybeRefOrGetter<ParsedBackupRepositoryUrl | undefined>
) {
  const { t } = useI18n()

  return useMapper<BackupRepositoryStorageMode, string>(
    () => {
      const parsedUrl = toValue(rawParsedUrl)

      if (parsedUrl?.type === undefined || parsedUrl.diskFormat === undefined) {
        return 'unknown'
      }

      return STORAGE_MODE_BY_DISK_FORMAT[parsedUrl.diskFormat]
    },
    {
      block: t('block-based'),
      file: t('file-based'),
      hbd: t('hbd'),
      unknown: t('unknown'),
    },
    'unknown'
  )
}
