import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useXoVmSnapshotRevertJob } from '@/modules/snapshot/jobs/xo-vm-snapshot-revert.job.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useVmSnapshotRevert(rawSnapshot: MaybeRefOrGetter<FrontXoVmSnapshot | undefined>) {
  const snapshot = toComputed(rawSnapshot)
  const snapshotBefore = ref(true)

  const {
    run,
    canRun: canRevertVmSnapshot,
    isRunning: isRevertingVmSnapshot,
  } = useXoVmSnapshotRevertJob(snapshot, snapshotBefore)

  const { open: revertVmSnapshot } = useOverlay({
    component: () => import('@/modules/snapshot/components/modal/VmSnapshotRevertModal.vue'),
    events: {
      onConfirm: confirmedSnapshotBefore => {
        snapshotBefore.value = confirmedSnapshotBefore

        run({ detached: true })
      },
      onCancel: true,
    },
  })

  return { revertVmSnapshot, canRevertVmSnapshot, isRevertingVmSnapshot }
}
