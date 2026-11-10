import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { XoBackupFormat } from '@/modules/backup-repository/types/xo-backup-repository.type.ts'
import { parseBackupRepositoryUrlSafely } from '@/modules/backup-repository/utils/xo-backup-repository-parsed-url.util.ts'
import { getBackupRepositoryStatus } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import type { BackupRepositoryType } from 'xo-remote-parser'

export type BackupRepositoryFilterableData = FrontXoBackupRepository & {
  type: BackupRepositoryType | undefined
  status: Status
  storageMode: XoBackupFormat
}

export function useBackupRepositoryEnhancedData(rawBrs: MaybeRefOrGetter<FrontXoBackupRepository[]>) {
  const brs = toComputed(rawBrs)

  const filterableBrs = computed<BackupRepositoryFilterableData[]>(() =>
    brs.value.map(br => {
      const parsedUrl = parseBackupRepositoryUrlSafely(br.url)

      return {
        ...br,
        type: parsedUrl?.type,
        status: getBackupRepositoryStatus(br),
        storageMode: parsedUrl?.useVhdDirectory ? 'block' : 'vhd',
      }
    })
  )

  return {
    filterableBrs,
  }
}
