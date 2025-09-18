import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state'
import type { XoMetadataBackupJob } from '@/types/xo/metadata-backup-job.type.ts'
import type { XoMirrorBackupJob } from '@/types/xo/mirror-backup-job.type.ts'
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type.ts'
import type { XoVm } from '@/types/xo/vm.type'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource'
import { useSorted } from '@vueuse/core'

export type XoBackupJob = XoVmBackupJob | XoMetadataBackupJob | XoMirrorBackupJob

const backupJobFields = [
  'id',
  'name',
  'mode',
  'type',
  'settings',
  'sourceRemote',
  'remotes',
  'filter',
  'pools',
  'xoMetadata',
  'srs',
  'vms',
  'compression',
  'proxy',
].join(',')

export const useXoBackupJobCollection = defineRemoteResource({
  url: (vmId?: XoVm['id']) =>
    vmId
      ? `/rest/v0/vms/${vmId}/backup-jobs?fields=${backupJobFields}`
      : `/rest/v0/backup-jobs?fields=${backupJobFields}`,
  initialData: () => [] as XoVmBackupJob[],
  state: (rawBackupJobs, context) => {
    const backupJobs = useSorted(rawBackupJobs, (backup1, backup2) => backup1.name.localeCompare(backup2.name))

    return {
      ...useXoCollectionState(backupJobs, {
        context,
        baseName: 'backupJob',
      }),
    }
  },
})
