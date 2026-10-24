import type { VdfHostState, VdfHostStatusDocument } from '@/modules/vdf/types.ts'

export const VDF_STATUS_KEY = 'vdf:status'

export function parseHostStatus(otherConfig: Record<string, string> | undefined): VdfHostStatusDocument | undefined {
  const raw = otherConfig?.[VDF_STATUS_KEY]

  if (raw === undefined) {
    return undefined
  }

  try {
    return JSON.parse(raw) as VdfHostStatusDocument
  } catch {
    return undefined
  }
}

// Same reading as `vdf-agent status`: a heartbeat older than twice its
// period means the agent is stopped or stuck.
export function hostState(
  status: VdfHostStatusDocument | undefined,
  publishedDocId: string,
  { live = true, now = Date.now() }: { live?: boolean; now?: number } = {}
): VdfHostState {
  if (!live) {
    return 'disabled'
  }

  if (status === undefined) {
    return 'unknown'
  }

  const heartbeat = Date.parse(status.heartbeat ?? '')

  if (Number.isNaN(heartbeat) || now - heartbeat > 2 * (status.heartbeatSec ?? 600) * 1000) {
    return 'stale'
  }

  if (status.rejected) {
    return 'rejected'
  }

  if ((status.published ?? '') !== publishedDocId || (status.doc ?? '') !== publishedDocId) {
    return 'behind'
  }

  return 'up-to-date'
}

export type VdfPolicyRealization = {
  realized: number
  total: number
  unknown: number
  reasons: string[]
}

// Per policy: on how many of the hosts it applies to (protected VIFs there,
// or a problem) it is realized; hosts without a reliable status apart.
export function policyRealization(
  policyName: string,
  hosts: { status: VdfHostStatusDocument | undefined; state: VdfHostState }[]
): VdfPolicyRealization {
  const realization: VdfPolicyRealization = { realized: 0, total: 0, unknown: 0, reasons: [] }

  for (const { status, state } of hosts) {
    if (state === 'disabled') {
      continue
    }

    if (state === 'unknown' || state === 'stale' || state === 'behind') {
      realization.unknown++
      continue
    }

    const policyStatus = status?.policies?.find(policy => policy.name === policyName)

    if (policyStatus === undefined) {
      continue
    }

    realization.total++

    if (policyStatus.realized) {
      realization.realized++
    } else if (policyStatus.reason) {
      realization.reasons.push(policyStatus.reason)
    }
  }

  return realization
}

export type VdfVmProtection =
  | 'quarantined'
  | 'quarantine-not-enforced'
  | 'protected'
  | 'outdated'
  | 'exposed'
  | 'protected-when-running'
  | 'monitored'
  | 'unprotected'

// Hosts whose agent enforces nothing reliable: no agent, or one stopped or
// stuck. A VM running there gets no flows at all, quarantine included.
const NOT_ENFORCING: VdfHostState[] = ['unknown', 'stale', 'disabled']

export const hostEnforces = (state: VdfHostState | undefined) => state !== undefined && !NOT_ENFORCING.includes(state)

// What the published document does for a VM now. It's enforced only on the
// host the VM runs on (at its own VIFs), so a running VM is protected only
// if that host's agent is current: an agent that rejected the document or
// hasn't applied it yet enforces the previous one (outdated), a host
// without a working agent nothing (exposed). A halted VM has no network
// interface to enforce anything on, its policies apply when it starts.
export function vmProtection({
  quarantined,
  running,
  policyCount,
  monitoredCount = 0,
  hostState,
}: {
  quarantined: boolean
  running: boolean
  // enforced policies applying to the VM
  policyCount: number
  // policies in monitor mode: they record what they'd drop, protect nothing
  monitoredCount?: number
  // the state of the host the VM runs on (unknown when it isn't found)
  hostState: VdfHostState
}): VdfVmProtection {
  const enforcing = !running || hostEnforces(hostState)

  if (quarantined) {
    return enforcing ? 'quarantined' : 'quarantine-not-enforced'
  }

  if (policyCount === 0) {
    return monitoredCount > 0 ? 'monitored' : 'unprotected'
  }

  if (!running) {
    return 'protected-when-running'
  }

  if (!enforcing) {
    return 'exposed'
  }

  return hostState === 'up-to-date' ? 'protected' : 'outdated'
}

export type VdfLockingMode = 'locked' | 'unlocked' | 'disabled'

// A network interface's locking as XAPI applies it: `network_default`
// follows its network (whose default is either unlocked or disabled).
export function effectiveLockingMode(lockingMode: string, networkDefaultIsLocked: boolean | undefined): VdfLockingMode {
  if (lockingMode === 'locked' || lockingMode === 'unlocked' || lockingMode === 'disabled') {
    return lockingMode
  }

  return networkDefaultIsLocked ? 'disabled' : 'unlocked'
}
