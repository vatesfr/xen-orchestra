import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoVdi } from '@vates/types'

// TODO: add const for vm-snapshot vdi fields
export const useXoVmSnapshotVdiCollection = defineRemoteResource({
  url: (snapshotId: string) => `${BASE_URL}/vm-snapshots/${snapshotId}/vdis?fields=*`,

  watchCollection: watchCollectionWrapper({
    collectionId: 'vmSnapshotVdi',
    resource: 'VDI',
  }),
  initialData: () => [] as XoVdi[],
  state: (vmSnapshotVdis, context) =>
    useXoCollectionState(vmSnapshotVdis, {
      context,
      baseName: 'vmSnapshotVdi',
    }),
})
