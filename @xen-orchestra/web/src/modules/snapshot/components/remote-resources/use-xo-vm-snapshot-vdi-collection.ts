import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import {
  vdiSnapshotFields,
  type FrontXoVdiSnapshot,
} from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { useOncePerScope, waitForCollection } from '@core/packages/remote-resource/utils/remote-resource.util.ts'
import { toValue } from 'vue'

export const useXoVmSnapshotVdiCollection = defineRemoteResource({
  url: (snapshotId: string) =>
    `${BASE_URL}/vm-snapshots/${snapshotId}/vdis?fields=${vdiSnapshotFields.join(',')}&ndjson=true`,
  stream: true,
  initWatchCollection: () =>
    useWatchCollection<FrontXoVdiSnapshot>({
      collectionId: 'vmSnapshotVdiSnapshot',
      resource: 'VDI-snapshot',
      fields: vdiSnapshotFields,
      async predicate(vdiSnapshot, context) {
        if (context === undefined || context.args === undefined || Array.isArray(vdiSnapshot)) {
          return true
        }

        const [id] = context.args
        const snapshotId = toValue(id)

        const { getVbdsByIds } = await waitForCollection(useOncePerScope(useXoVbdCollection, context))

        const vbds = getVbdsByIds(vdiSnapshot.$VBDs)
        return vbds.some(vbd => vbd.VM === snapshotId)
      },
    }),
  initialData: () => [] as FrontXoVdiSnapshot[],
  state: (vmSnapshotVdis, context) =>
    useXoCollectionState(vmSnapshotVdis, {
      context,
      baseName: 'vmSnapshotVdiSnapshot',
    }),
})
