import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoBackupRepository } from '@vates/types'

export type FrontXoBackupRepository = Pick<XoBackupRepository, (typeof backupRepositoryFields)[number]>

const backupRepositoryFields = ['id', 'name', 'enabled'] as const satisfies readonly (keyof XoBackupRepository)[]

export const useXoBackupRepositoryCollection = defineRemoteResource({
  url: `${BASE_URL}/backup-repositories?fields=${backupRepositoryFields.join(',')}`,
  initialData: () => [] as FrontXoBackupRepository[],
  state: (backupRepositories, context) =>
    useXoCollectionState(backupRepositories, {
      context,
      baseName: ['backupRepository', 'backupRepositories'],
    }),
})
