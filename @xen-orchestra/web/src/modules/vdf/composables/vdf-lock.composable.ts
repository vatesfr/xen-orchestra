import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useVdfLockJob, type VdfLockRequest } from '@/modules/vdf/jobs/vdf-lock.job.ts'
import { effectiveLockingMode } from '@/modules/vdf/utils/vdf-status.util.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { reactive, ref } from 'vue'

// an interface the confirmation offers to lock
export type VdfLockTarget = {
  vifId: string
  device: string
  vmName: string
  networkName: string | undefined
  // proposed: what the guest reports now (none: the user enters them)
  addresses: string[]
  // a relock: what it's locked to now
  lockedTo?: string[]
}

// what the confirmation shows of the lock in progress: the VIFs locked,
// and why the others failed (by VIF id), or why nothing was sent
export type VdfLockState = {
  locked: string[]
  errors: Record<string, string>
  error?: string
}

// an interface XAPI lets use any address (network_default follows its
// network, whose default is either unlocked or disabled)
export const isUnlocked = (vif: FrontXoVif, network: FrontXoNetwork | undefined) =>
  effectiveLockingMode(vif.lockingMode, network?.defaultIsLocked) === 'unlocked'

export function lockTarget(
  vif: FrontXoVif,
  {
    vmName,
    network,
    addresses,
    lockedTo,
  }: { vmName: string; network?: FrontXoNetwork; addresses: string[]; lockedTo?: string[] }
): VdfLockTarget {
  return { vifId: vif.id, device: vif.device, vmName, networkName: network?.name_label, addresses, lockedTo }
}

// Locking an interface (vdf#15), alone or a group's at once: one
// confirmation listing them, addresses editable. It stays open until every
// interface is locked: one that fails shows its error in its row, the
// others are locked anyway, and confirming again retries the failed ones.
export function useVdfLock() {
  const requests = ref<VdfLockRequest[]>([])

  const { run, isRunning } = useVdfLockJob(requests)

  const { open } = useOverlay({
    component: () => import('@/modules/vdf/components/vm/VdfLockModal.vue'),
    events: { onConfirm: (confirmed: VdfLockRequest[]) => confirmed, onCancel: true },
  })

  // resolves to the VIFs locked (some may be, even when it was cancelled)
  async function confirmLock(targets: VdfLockTarget[], { group }: { group?: string } = {}) {
    const state = reactive<VdfLockState>({ locked: [], errors: {} })

    await open({
      props: { targets, group, state },
      events: {
        onConfirm: async confirmed => {
          requests.value = confirmed
          state.error = undefined

          try {
            const failures = await run()

            state.errors = Object.fromEntries(failures)
            state.locked.push(...confirmed.map(request => request.vifId).filter(vifId => !failures.has(vifId)))

            return failures.size > 0 ? KEEP_OVERLAY_OPEN : confirmed
          } catch (error) {
            state.error = error instanceof Error ? error.message : String(error)

            return KEEP_OVERLAY_OPEN
          }
        },
      },
    })

    return [...state.locked]
  }

  return { confirmLock, isLocking: isRunning }
}
