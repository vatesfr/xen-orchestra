import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoBackupRepository } from '@vates/types'

export const useXoBackupRepositoryCollection = defineRemoteResource({
  url: '/rest/v0/backup-repositories?fields=id,name,enabled,physical_usage,size',
  initialData: () => [] as XoBackupRepository[],
  state: (backupRepositories, context) =>
    useXoCollectionState(backupRepositories, {
      context,
      baseName: ['backupRepository', 'backupRepositories'],
    }),
})
