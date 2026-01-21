import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVm, AnyXoBackupJob } from '@vates/types'
import { useSorted } from '@vueuse/core'

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
      ? `${BASE_URL}/vms/${vmId}/backup-jobs?fields=${backupJobFields}`
      : `${BASE_URL}/backup-jobs?fields=${backupJobFields}`,
  initialData: () => [] as AnyXoBackupJob[],
  state: (rawBackupJobs, context) => {
    const backupJobs = useSorted(rawBackupJobs, ({ name: name1 = '' }, { name: name2 = '' }) =>
      name1.localeCompare(name2)
    )

    return {
      ...useXoCollectionState(backupJobs, {
        context,
        baseName: 'backupJob',
      }),
    }
  },
})
