import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVm, XoVmBackupJob, XoMetadataBackupJob, XoMirrorBackupJob } from '@vates/types'
import { useSorted } from '@vueuse/core'

export type FrontXoVmBackupJob = Pick<XoVmBackupJob, (typeof vmBackupJobFields)[number]>
export type FrontXoMetadataBackupJob = Pick<XoMetadataBackupJob, (typeof metadataBackupJobFields)[number]>
export type FrontXoMirrorBackupJob = Pick<XoMirrorBackupJob, (typeof mirrorBackupJobfields)[number]>

export type FrontAnyXoBackupJob = FrontXoVmBackupJob | FrontXoMetadataBackupJob | FrontXoMirrorBackupJob

const vmBackupJobFields = [
  'id',
  'name',
  'mode',
  'type',
  'settings',
  'remotes',
  'srs',
  'vms',
  'compression',
  'proxy',
] as const satisfies readonly (keyof XoVmBackupJob)[]

const metadataBackupJobFields = [
  'id',
  'name',
  'type',
  'settings',
  'remotes',
  'pools',
  'xoMetadata',
  'proxy',
] as const satisfies readonly (keyof XoMetadataBackupJob)[]

const mirrorBackupJobfields = [
  'id',
  'name',
  'mode',
  'type',
  'settings',
  'sourceRemote',
  'remotes',
  'proxy',
] as const satisfies readonly (keyof XoMirrorBackupJob)[]

// Ensure fields are unique
const anyBackupJobFields = Array.from(
  new Set([...vmBackupJobFields, ...metadataBackupJobFields, ...mirrorBackupJobfields])
)

export const useXoBackupJobCollection = <T extends XoVm['id'] | (() => XoVm['id']) | undefined = undefined>(
  parentsContext?: object,
  vmId?: T
) =>
  defineRemoteResource({
    url: (vmId?: T) =>
      vmId
        ? `${BASE_URL}/vms/${vmId}/backup-jobs?fields=${vmBackupJobFields.join(',')}`
        : `${BASE_URL}/backup-jobs?fields=${anyBackupJobFields.join(',')}`,
    initialData: () => [] as (T extends undefined ? FrontAnyXoBackupJob : FrontXoVmBackupJob)[],
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
  })(parentsContext, vmId)
