import { useXoBackupRepositoryTypeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-label.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryStatus } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedBackupRepositoryUrl } from 'xo-remote-parser'

export function useXoBackupRepositoryUtils(
  rawBr: MaybeRefOrGetter<FrontXoBackupRepository>,
  rawParsedBrUrl: MaybeRefOrGetter<ParsedBackupRepositoryUrl | undefined>
) {
  const { t } = useI18n()

  const { useGetProxyById } = useXoProxyCollection()

  const brStatus = computed(() => getBackupRepositoryStatus(toValue(rawBr)))

  const brType = useXoBackupRepositoryTypeLabel(() => toValue(rawParsedBrUrl)?.type)

  const brStorageMode = computed(() => {
    const parsedBrUrl = toValue(rawParsedBrUrl)

    if (parsedBrUrl?.type === undefined) {
      return t('unknown')
    }

    return parsedBrUrl.useVhdDirectory ? t('block-based') : t('file-based')
  })

  const brProxy = useGetProxyById(() => toValue(rawBr).proxy)

  const isEncrypted = computed(() => toValue(rawParsedBrUrl)?.encryptionKey !== undefined)

  return { brStatus, brType, brStorageMode, brProxy, isEncrypted }
}
