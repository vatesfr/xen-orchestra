import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVmSnapshot } from '@vates/types'

export type FrontXoVmSnapshot = Pick<XoVmSnapshot, (typeof vmSnapshotFields)[number]>

const vmSnapshotFields = [
  '$snapshot_of',
  'name_label',
  'name_description',
  'id',
  'memory',
  'snapshot_time',
  'parent',
  'power_state',
  'other',
  'creation',
  '$VBDs',
] as const satisfies readonly (keyof XoVmSnapshot)[]

export const useXoVmSnapshotCollection = defineRemoteResource({
  url: `${BASE_URL}/vm-snapshots?fields=${vmSnapshotFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'VM-snapshot' }),
  initialData: () => [] as FrontXoVmSnapshot[],
  state: (snapshots, context) =>
    useXoCollectionState(snapshots, {
      context,
      baseName: 'snapshot',
    }),
})
