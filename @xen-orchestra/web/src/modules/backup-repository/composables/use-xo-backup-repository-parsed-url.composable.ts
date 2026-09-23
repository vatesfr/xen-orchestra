import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

export function useXoBackupRepositoryParsedUrl(rawBr: MaybeRefOrGetter<FrontXoBackupRepository | undefined>) {
  return computed(() => {
    const br = toValue(rawBr)

    return br === undefined ? undefined : parseBackupRepositoryUrl(br.url)
  })
}
