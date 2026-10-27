import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useVdfLockJob, type VdfLockRequest } from '@/modules/vdf/jobs/vdf-lock.job.ts'
import { useVdfUnlockJob, type VdfUnlockRequest } from '@/modules/vdf/jobs/vdf-unlock.job.ts'
import type { VdfLockProposal, VdfVifLock } from '@/modules/vdf/utils/vdf-locking.util.ts'
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
  // proposed: what the guest reports now, IPv4 and stable IPv6 (none: the
  // user enters them)
  addresses: string[]
  // the guest's other IPv6 addresses (temporary), offered unticked
  optional: string[]
  // a relock: what it's locked to now
  lockedTo?: string[]
  // how it's locked now (vdf#41): a relock keeps XAPI's or VDF's lock
  lock?: VdfVifLock
  // why VDF can't lock it (the agent of its host), if XAPI refuses to
  vdfUnavailable?: 'agent' | 'old-agent'
  // the host whose agent would enforce a VDF lock
  hostName?: string
}

// what the confirmation shows of the lock in progress: the VIFs locked,
// why the others failed (by VIF id), or why nothing was sent; the VIFs
// XAPI refused to lock because an SDN controller is registered (vdf#41)
export type VdfLockState = {
  locked: string[]
  errors: Record<string, string>
  sdnRefused: string[]
  error?: string
}

export function lockTarget(
  vif: FrontXoVif,
  {
    vmName,
    network,
    proposal,
    lockedTo,
    lock,
    vdfUnavailable,
    hostName,
  }: {
    vmName: string
    network?: FrontXoNetwork
    proposal: VdfLockProposal
    lockedTo?: string[]
    lock?: VdfVifLock
    vdfUnavailable?: 'agent' | 'old-agent'
    hostName?: string
  }
): VdfLockTarget {
  return {
    vifId: vif.id,
    device: vif.device,
    vmName,
    networkName: network?.name_label,
    addresses: proposal.addresses,
    optional: proposal.optional,
    lockedTo,
    lock,
    vdfUnavailable,
    hostName,
  }
}

// Locking an interface (vdf#15), alone or a group's at once: one
// confirmation listing them, addresses editable. It stays open until every
// interface is locked: one that fails shows its error in its row, the
// others are locked anyway, and confirming again retries the failed ones.
// One XAPI refuses to lock because an SDN controller is registered is
// offered a VDF lock instead (vdf#41), where its host's agent supports it:
// confirming again locks it with VDF.
export function useVdfLock() {
  const requests = ref<VdfLockRequest[]>([])

  const { run, isRunning } = useVdfLockJob(requests)

  const { open } = useOverlay({
    component: () => import('@/modules/vdf/components/vm/VdfLockModal.vue'),
    events: { onConfirm: (confirmed: VdfLockRequest[]) => confirmed, onCancel: true },
  })

  // resolves to the VIFs locked (some may be, even when it was cancelled)
  async function confirmLock(targets: VdfLockTarget[], { group }: { group?: string } = {}) {
    const state = reactive<VdfLockState>({ locked: [], errors: {}, sdnRefused: [] })

    await open({
      props: { targets, group, state },
      events: {
        onConfirm: async confirmed => {
          requests.value = confirmed
          state.error = undefined

          try {
            const failures = await run()

            state.errors = Object.fromEntries([...failures].map(([vifId, failure]) => [vifId, failure.message]))
            state.locked.push(...confirmed.map(request => request.vifId).filter(vifId => !failures.has(vifId)))

            for (const [vifId, failure] of failures) {
              if (failure.kind === 'sdn-controller' && !state.sdnRefused.includes(vifId)) {
                state.sdnRefused.push(vifId)
              }
            }

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

// an interface VDF locks, to unlock
export type VdfUnlockTarget = {
  vifId: string
  device: string
  vmName: string
  // what it's locked to
  allowed: string[]
}

// Removing a VDF lock (vdf#41), after a confirmation: the interface may
// then use any address. Its allowed addresses stay (XAPI ignores them on
// an unlocked interface, and a later lock proposes them), unless the user
// clears them. Resolves to whether it was unlocked; a failure shows in the
// confirmation, which stays open.
export function useVdfUnlock() {
  const requests = ref<VdfUnlockRequest[]>([])

  const { run, isRunning } = useVdfUnlockJob(requests)

  const { open } = useOverlay({
    component: () => import('@/modules/vdf/components/vm/VdfUnlockModal.vue'),
    events: { onConfirm: (clear: boolean) => clear, onCancel: true },
  })

  async function confirmUnlock(target: VdfUnlockTarget) {
    const state = reactive<{ error?: string }>({})
    let isUnlocked = false

    await open({
      props: { target, state },
      events: {
        onConfirm: async clear => {
          requests.value = [{ vifId: target.vifId, clear }]
          state.error = undefined

          try {
            await run()
            isUnlocked = true

            return clear
          } catch (error) {
            state.error = error instanceof Error ? error.message : String(error)

            return KEEP_OVERLAY_OPEN
          }
        },
      },
    })

    return isUnlocked
  }

  return { confirmUnlock, isUnlocking: isRunning }
}
