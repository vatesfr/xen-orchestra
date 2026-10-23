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

export type VdfVmProtection = 'quarantined' | 'protected' | 'protected-when-running' | 'unprotected'

// What the published document does for a VM now: a halted VM has no
// network interface to enforce anything on, its policies apply when it
// starts.
export function vmProtection({
  quarantined,
  running,
  policyCount,
}: {
  quarantined: boolean
  running: boolean
  policyCount: number
}): VdfVmProtection {
  if (quarantined) {
    return 'quarantined'
  }

  if (policyCount === 0) {
    return 'unprotected'
  }

  return running ? 'protected' : 'protected-when-running'
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
