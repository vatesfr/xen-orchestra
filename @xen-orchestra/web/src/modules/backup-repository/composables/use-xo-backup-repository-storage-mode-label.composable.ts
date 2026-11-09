import { useMapper } from '@core/packages/mapper'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedBackupRepositoryUrl } from 'xo-remote-parser'

type BackupRepositoryStorageMode = 'block' | 'file' | 'unknown'

export function useXoBackupRepositoryStorageModeLabel(
  rawParsedUrl: MaybeRefOrGetter<ParsedBackupRepositoryUrl | undefined>
) {
  const { t } = useI18n()

  return useMapper<BackupRepositoryStorageMode, string>(
    () => {
      const parsedUrl = toValue(rawParsedUrl)

      if (parsedUrl?.type === undefined) {
        return 'unknown'
      }

      return parsedUrl.useVhdDirectory ? 'block' : 'file'
    },
    {
      block: t('block-based'),
      file: t('file-based'),
      unknown: t('unknown'),
    },
    'unknown'
  )
}
