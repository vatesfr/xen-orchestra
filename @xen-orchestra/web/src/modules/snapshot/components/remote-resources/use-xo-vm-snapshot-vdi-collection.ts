import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVdiSnapshot } from '@vates/types'

export type FrontXoVmSnapshotVdi = Pick<XoVdiSnapshot, (typeof vmSnapshotVdiFields)[number]>

const vmSnapshotVdiFields = [
  'id',
  'name_label',
  '$VBDs',
  'image_format',
  'name_description',
  'usage',
  '$snapshot_of',
] as const satisfies readonly (keyof XoVdiSnapshot)[]

export const useXoVmSnapshotVdiCollection = defineRemoteResource({
  url: (snapshotId: string) => `${BASE_URL}/vm-snapshots/${snapshotId}/vdis?fields=${vmSnapshotVdiFields.join(',')}`,
  initWatchCollection: () =>
    useWatchCollection({
      collectionId: 'vmSnapshotVdi',
      resource: 'VDI',
    }),
  initialData: () => [] as FrontXoVmSnapshotVdi[],
  state: (vmSnapshotVdis, context) =>
    useXoCollectionState(vmSnapshotVdis, {
      context,
      baseName: 'vmSnapshotVdi',
    }),
})
