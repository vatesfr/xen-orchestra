import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoBackupRepository, XoVmBackupArchive } from '@vates/types'

const vmBackupArchiveFields: (keyof XoVmBackupArchive)[] = ['id', 'size', 'vm', 'type'] as const

export const useXoVmBackupArchiveCollection = defineRemoteResource({
  url: (backupRepositoriesIds: XoBackupRepository['id'][]) => {
    const queryParamBackupRepositoriesIds = backupRepositoriesIds
      .map(backupRepositoryId => `backup-repository=${backupRepositoryId}`)
      .join('&')

    return `${BASE_URL}/backup-archives?fields=${vmBackupArchiveFields.join(',')}&${queryParamBackupRepositoriesIds}`
  },
  initialData: () => [] as XoVmBackupArchive[],
  state: (rawBackupArchives, context) =>
    useXoCollectionState(rawBackupArchives, {
      context,
      baseName: 'backupArchive',
    }),
})
