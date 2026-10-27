import type { VdfDocument, VdfHostState, VdfHostStatusDocument } from '@/modules/vdf/types.ts'
import { hasEgress } from '@/modules/vdf/utils/vdf-rules.util.ts'

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

// a heartbeat this far ahead of XO's clock is still read as current (the
// plugin's FUTURE_HEARTBEAT_MS)
export const FUTURE_HEARTBEAT_MS = 60_000

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
  const period = typeof status.heartbeatSec === 'number' && status.heartbeatSec > 0 ? status.heartbeatSec : 600

  // a heartbeat further ahead than clock skew says nothing about now
  if (Number.isNaN(heartbeat) || heartbeat - now > FUTURE_HEARTBEAT_MS || now - heartbeat > 2 * period * 1000) {
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

// Hosts whose agent won't apply what a publish writes (vdf#38): none (it
// never wrote its status) or one stopped or stuck (stale). Their VMs keep
// the policy that agent last applied, or have none. A halted host runs no
// VM: left out.
export type VdfAgentGaps = { missing: string[]; stale: string[] }

export function agentGaps(
  hosts: { name: string; status: VdfHostStatusDocument | undefined; running: boolean }[],
  now = Date.now()
): VdfAgentGaps {
  const gaps: VdfAgentGaps = { missing: [], stale: [] }

  for (const { name, status, running } of hosts) {
    const state = hostState(status, '', { live: running, now })

    if (state === 'unknown') {
      gaps.missing.push(name)
    } else if (state === 'stale') {
      gaps.stale.push(name)
    }
  }

  gaps.missing.sort((a, b) => a.localeCompare(b))
  gaps.stale.sort((a, b) => a.localeCompare(b))

  return gaps
}

// The policy format a host's agent enforces, from the pool key it reads
// (`vdf:policy.v5`: 5, `vdf:policy`: 1); undefined for none, or its last
// valid policy after a rejection
export function enforcedVersion(status: VdfHostStatusDocument | undefined): number | undefined {
  const match = /^vdf:policy(?:\.v(\d+))?$/.exec(status?.source ?? '')

  return match === null ? undefined : Number(match[1] ?? 1)
}

// An agent older than egress (vdf#53) enforces a document's ingress only:
// it reads an older key, written without the egress rules, and reports
// itself up to date
export function ignoresEgress(status: VdfHostStatusDocument | undefined, document: VdfDocument) {
  const version = enforcedVersion(status)

  return version !== undefined && version < 6 && document.policies.some(hasEgress)
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
