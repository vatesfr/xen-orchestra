import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useXoVmSnapshotRevertJob } from '@/modules/snapshot/jobs/xo-vm-snapshot-revert.job.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useVmSnapshotRevertModal(rawSnapshot: MaybeRefOrGetter<FrontXoVmSnapshot | undefined>) {
  const snapshot = toComputed(rawSnapshot)
  const snapshotBefore = ref(true)

  const { run, canRun, isRunning } = useXoVmSnapshotRevertJob(snapshot, snapshotBefore)

  const { open: openModal } = useOverlay({
    component: () => import('@/modules/snapshot/components/modal/VmSnapshotRevertModal.vue'),
    events: {
      onConfirm: async confirmedSnapshotBefore => {
        snapshotBefore.value = confirmedSnapshotBefore

        try {
          await run()
        } catch (error) {
          console.error('Error when reverting to snapshot:', error)
        }
      },
      onCancel: true,
    },
  })

  return { openModal, canRun, isRunning }
}
