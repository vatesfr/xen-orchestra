import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoMetadataBackup } from '@/types/xo/metadata-backup.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoMetadataBackupsCollection = defineRemoteResource({
  url: '/rest/v0/backup/jobs/metadata?fields=id,name,type,pools,xoMetadata,remotes',
  initialData: () => [] as XoMetadataBackup[],
  state: (metadataBackups, context) =>
    useXoCollectionState(metadataBackups, {
      context,
      baseName: 'metadataBackup',
    }),
})
