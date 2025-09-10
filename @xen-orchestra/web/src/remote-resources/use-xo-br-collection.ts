import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoBackupRepository } from '@/types/xo/br.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoBackupRepositoryCollection = defineRemoteResource({
  url: '/rest/v0/backup-repositories?fields=id,name,enabled',
  initialData: () => [] as XoBackupRepository[],
  state: (backupRepositories, context) =>
    useXoCollectionState(backupRepositories, {
      context,
      baseName: ['backupRepository', 'backupRepositories'],
    }),
})
