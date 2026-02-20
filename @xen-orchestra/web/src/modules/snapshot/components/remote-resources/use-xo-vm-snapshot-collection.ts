import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVmSnapshot } from '@vates/types'

// TODO: add const for vm-snapshot fields
export const useXoVmSnapshotCollection = defineRemoteResource({
  // url: `${BASE_URL}/vm-snapshots?fields=$snapshot_of,name_label,name_description,id,memory`,
  url: `${BASE_URL}/vm-snapshots?fields=*`,
  watchCollection: watchCollectionWrapper({ resource: 'VM-snapshot' }),
  initialData: () => [] as XoVmSnapshot[],
  state: (snapshots, context) =>
    useXoCollectionState(snapshots, {
      context,
      baseName: 'snapshot',
    }),
})
