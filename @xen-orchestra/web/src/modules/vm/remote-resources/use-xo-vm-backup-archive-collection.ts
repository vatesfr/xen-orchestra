import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoBackupRepository, XoVmBackupArchive } from '@vates/types'
import { toValue } from 'vue'

export type FrontXoVmBackupArchive = Pick<XoVmBackupArchive, (typeof vmBackupArchiveFields)[number]>

const vmBackupArchiveFields = [
  'id',
  'size',
  'vm',
  'type',
  'mode',
  'timestamp',
  'backupRepository', // `backupRepository` is needed by the predicate
] as const satisfies readonly (keyof XoVmBackupArchive)[]

export const useXoVmBackupArchiveCollection = defineRemoteResource({
  url: (backupRepositoriesIds: XoBackupRepository['id'][]) => {
    const queryParamBackupRepositoriesIds = backupRepositoriesIds
      .map(backupRepositoryId => `backup-repository=${backupRepositoryId}`)
      .join('&')

    return `${BASE_URL}/backup-archives?fields=${vmBackupArchiveFields.join(',')}&ndjson=true&${queryParamBackupRepositoriesIds}`
  },
  stream: true,
  initWatchCollection: () =>
    useWatchCollection<FrontXoVmBackupArchive>({
      resource: 'backup-archive',
      fields: vmBackupArchiveFields,
      predicate(obj, context) {
        if (context === undefined || context.args === undefined || Array.isArray(obj)) {
          return true
        }

        const [ids] = context.args
        const backupRepositoriesIds = toValue(ids)

        return backupRepositoriesIds.includes(obj.backupRepository)
      },
    }),
  initialData: () => [] as FrontXoVmBackupArchive[],
  state: (rawBackupArchives, context) =>
    useXoCollectionState(rawBackupArchives, {
      context,
      baseName: 'backupArchive',
    }),
})
