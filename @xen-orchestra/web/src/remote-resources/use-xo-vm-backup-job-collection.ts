import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoVmBackupJobCollection = defineRemoteResource({
  url: '/rest/v0/backup/jobs/vm?fields=id,name,mode,type,settings,remotes,srs,vms',
  initialData: () => [] as XoVmBackupJob[],
  state: (vmBackupJobs, context) =>
    useXoCollectionState(vmBackupJobs, {
      context,
      baseName: 'vmBackupJob',
    }),
})
