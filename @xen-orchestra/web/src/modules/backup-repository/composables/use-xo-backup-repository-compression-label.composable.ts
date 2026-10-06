import { isBackupRepositoryCompression } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import type { BACKUP_REPOSITORY_COMPRESSION } from '@vates/types'
import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoBackupRepositoryCompressionLabels(): ComputedRef<Record<BACKUP_REPOSITORY_COMPRESSION, string>> {
  const { t } = useI18n()

  return computed(() => ({
    brotli: t('brotli'),
    gzip: t('gzip'),
    zstd: t('zstd'),
    none: t('disabled'),
  }))
}

export function useXoBackupRepositoryCompressionLabel(rawCompression: MaybeRefOrGetter<string | undefined>) {
  const { t } = useI18n()

  const compressionLabels = useXoBackupRepositoryCompressionLabels()

  return computed(() => {
    const compression = toValue(rawCompression)

    if (compression === undefined) {
      return t('unknown')
    }

    // a compression set by hand in the URL is shown as is
    if (!isBackupRepositoryCompression(compression)) {
      return compression
    }

    return compressionLabels.value[compression]
  })
}
