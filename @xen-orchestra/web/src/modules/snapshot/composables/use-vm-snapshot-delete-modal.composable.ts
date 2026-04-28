import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useXoVmSnapshotDeleteJob } from '@/modules/snapshot/jobs/xo-vm-snapshot-delete.job.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useVmSnapshotDeleteModal(rawSnapshots: MaybeRefOrGetter<FrontXoVmSnapshot[]>) {
  const snapshots = toComputed(rawSnapshots)

  const { run, canRun, isRunning } = useXoVmSnapshotDeleteJob(snapshots)

  const openModal = useModal({
    component: import('@/modules/snapshot/components/modal/VmSnapshotDeleteModal.vue'),
    props: { count: snapshots.value.length },
    onConfirm: async () => {
      try {
        await run()
      } catch (error) {
        console.error('Error when deleting snapshot:', error)
      }
    },
  })

  return { openModal, canRun, isRunning }
}
