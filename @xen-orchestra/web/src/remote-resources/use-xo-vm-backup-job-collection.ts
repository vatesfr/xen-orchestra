import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type.ts'
import type { XoVm } from '@/types/xo/vm.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

const backupJobFields = ['id', 'name', 'mode', 'type', 'settings', 'remotes', 'srs', 'vms'].join(',')

export const useXoVmBackupJobCollection = defineRemoteResource({
  url: (vmId?: XoVm['id']) =>
    vmId
      ? `/rest/v0/vms/${vmId}/backup-jobs?fields=${backupJobFields}`
      : `/rest/v0/backup/jobs/vm?fields=${backupJobFields}`,
  initialData: () => [] as XoVmBackupJob[],
  state: (vmBackupJobs, context) =>
    useXoCollectionState(vmBackupJobs, {
      context,
      baseName: 'vmBackupJob',
    }),
})
