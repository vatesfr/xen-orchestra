import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoMetadataBackupJob } from '@/types/xo/metadata-backup-job.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoMetadataBackupJobCollection = defineRemoteResource({
  url: '/rest/v0/backup/jobs/metadata?fields=id,name,type,pools,xoMetadata,remotes',
  initialData: () => [] as XoMetadataBackupJob[],
  state: (metadataBackupJobs, context) =>
    useXoCollectionState(metadataBackupJobs, {
      context,
      baseName: 'metadataBackupJob',
    }),
})
