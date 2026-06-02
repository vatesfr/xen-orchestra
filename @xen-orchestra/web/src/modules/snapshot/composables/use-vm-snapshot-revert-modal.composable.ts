import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useXoVmSnapshotRevertJob } from '@/modules/snapshot/jobs/xo-vm-snapshot-revert.job.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useVmSnapshotRevertModal(rawSnapshot: MaybeRefOrGetter<FrontXoVmSnapshot>) {
  const snapshot = toComputed(rawSnapshot)
  const snapshotBefore = ref(true)

  const { run, canRun, isRunning } = useXoVmSnapshotRevertJob(snapshot, snapshotBefore)

  const openModal = useModal(() => ({
    component: import('@/modules/snapshot/components/modal/VmSnapshotRevertModal.vue'),
    onConfirm: async (confirmedSnapshotBefore: boolean) => {
      snapshotBefore.value = confirmedSnapshotBefore
      try {
        await run()
      } catch (error) {
        console.error('Error when reverting to snapshot:', error)
      }
    },
  }))

  return { openModal, canRun, isRunning }
}
