import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoVmBackup } from '@/types/xo/vm-backup.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoVmBackupsCollection = defineRemoteResource({
  url: '/rest/v0/backup/jobs/vm?fields=id,name,mode,type,settings,remotes,srs,vms',
  initialData: () => [] as XoVmBackup[],
  state: (vmBackups, context) =>
    useXoCollectionState(vmBackups, {
      context,
      baseName: 'vmBackup',
    }),
})
