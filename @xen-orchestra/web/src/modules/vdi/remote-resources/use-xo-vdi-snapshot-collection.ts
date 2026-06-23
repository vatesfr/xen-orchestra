import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVdiSnapshot } from '@vates/types'

export type FrontXoVdiSnapshot = Pick<XoVdiSnapshot, (typeof vdiSnapshotFields)[number]>

export const vdiSnapshotFields = [
  'id',
  'name_label',
  'name_description',
  '$VBDs',
  '$SR',
  'size',
  '$pool',
  'type',
  'usage',
  'tags',
  'uuid',
  'snapshot_time',
  '$snapshot_of',
  'image_format',
  'cbt_enabled',
] as const satisfies readonly (keyof XoVdiSnapshot)[]

export const useXoVdiSnapshotCollection = defineRemoteResource({
  url: `${BASE_URL}/vdi-snapshots?fields=${vdiSnapshotFields.join(',')}`,
  initWatchCollection: () => useWatchCollection({ resource: 'VDI-snapshot', fields: vdiSnapshotFields }),
  initialData: () => [] as FrontXoVdiSnapshot[],
  state: (vdiSnapshots, context) =>
    useXoCollectionState(vdiSnapshots, {
      context,
      baseName: 'vdiSnapshot',
    }),
})
