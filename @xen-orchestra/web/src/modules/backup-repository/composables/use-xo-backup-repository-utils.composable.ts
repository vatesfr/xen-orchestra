import { useXoBackupRepositoryStorageModeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-storage-mode-label.composable.ts'
import { useXoBackupRepositoryTypeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-label.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import {
  getBackupRepositoryStatus,
  isBackupRepositoryEncrypted,
} from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import type { ParsedBackupRepositoryUrl } from 'xo-remote-parser'

export function useXoBackupRepositoryUtils(
  rawBr: MaybeRefOrGetter<FrontXoBackupRepository>,
  rawParsedBrUrl: MaybeRefOrGetter<ParsedBackupRepositoryUrl | undefined>
) {
  const { useGetProxyById } = useXoProxyCollection()

  const brStatus = computed(() => getBackupRepositoryStatus(toValue(rawBr)))

  const brType = useXoBackupRepositoryTypeLabel(() => toValue(rawParsedBrUrl)?.type)

  const brStorageMode = useXoBackupRepositoryStorageModeLabel(rawParsedBrUrl)

  const brProxy = useGetProxyById(() => toValue(rawBr).proxy)

  const isEncrypted = computed(() => isBackupRepositoryEncrypted(toValue(rawParsedBrUrl)))

  return { brStatus, brType, brStorageMode, brProxy, isEncrypted }
}
