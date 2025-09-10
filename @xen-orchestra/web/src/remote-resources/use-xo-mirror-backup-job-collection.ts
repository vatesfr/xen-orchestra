import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoMirrorBackupJob } from '@/types/xo/mirror-backup-job.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoMirrorBackupJobCollection = defineRemoteResource({
  url: '/rest/v0/backup-jobs?filter=type:mirrorBackup&fields=id,name,mode,type,sourceRemote,remotes,settings,filter',
  initialData: () => [] as XoMirrorBackupJob[],
  state: (mirrorBackupJobs, context) =>
    useXoCollectionState(mirrorBackupJobs, {
      context,
      baseName: 'mirrorBackupJob',
    }),
})
