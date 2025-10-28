import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state'
import type { XoBackupRepository } from '@/types/xo/br.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource'
import type { XoVmBackupArchive } from '@vates/types'

export const useXoVmBackupArchiveCollection = defineRemoteResource({
  url: (backupRepositoriesIds: XoBackupRepository['id'][]) => {
    const queryParamBackupRepositoriesIds = backupRepositoriesIds
      .map(backupRepositoryId => `backup-repository=${backupRepositoryId}`)
      .join('&')

    return `/rest/v0/backup-archives?fields=id,size,vm,type&${queryParamBackupRepositoriesIds}`
  },
  initialData: () => [] as XoVmBackupArchive[],
  state: (rawBackupArchives, context) =>
    useXoCollectionState(rawBackupArchives, {
      context,
      baseName: 'backupArchive',
    }),
})
