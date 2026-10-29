import type { VdfHostState, VdfHostStatusDocument, VdfShadowedVif } from '@/modules/vdf/types.ts'
import { hostEnforces } from '@/modules/vdf/utils/vdf-status.util.ts'

// XO's Traffic Rules (SDN controller) on a VM VDF guards (vdf#40, vdf#102).
// Agents that put VDF's flows above Traffic Rules (status
// `aboveTrafficRules`):
// - vdf-first: an allow, which can't let anything past VDF, deciding first;
// - applies-after: a drop, which applies after VDF's decision, on every
//   path: the traffic needs both.
// Older agents leave them in table 0 at priority 32768, above VDF's flows:
// - not-applied: VDF doesn't apply it nor log it, and for the traffic it
//   matches it decides first.
// Either way, flows the agent found deciding before VDF (status
// `shadowed`, a foreign controller's or an older agent's view):
// - bypasses: an allow letting traffic past VDF;
// - decides-first: a drop of traffic VDF may allow.
export type VdfTrafficRuleStatus = 'bypasses' | 'decides-first' | 'not-applied' | 'applies-after' | 'vdf-first'

export function trafficRuleStatus(
  rule: { allow: boolean },
  shadow: VdfShadowedVif | undefined,
  aboveTrafficRules = false
): VdfTrafficRuleStatus {
  if (shadow !== undefined) {
    if (rule.allow && shadow.allows > 0) {
      return 'bypasses'
    }

    if (!rule.allow && shadow.drops > 0) {
      return 'decides-first'
    }
  }

  if (aboveTrafficRules) {
    return rule.allow ? 'vdf-first' : 'applies-after'
  }

  return 'not-applied'
}

// most telling first: a rule of a network covers several VIFs, it takes the
// status of the one that matters most
export const TRAFFIC_RULE_SEVERITY: VdfTrafficRuleStatus[] = [
  'bypasses',
  'decides-first',
  'not-applied',
  'applies-after',
  'vdf-first',
]

export const mostSevere = (statuses: VdfTrafficRuleStatus[]) =>
  TRAFFIC_RULE_SEVERITY.find(status => statuses.includes(status))

export const TRAFFIC_RULE_ACCENTS: Record<VdfTrafficRuleStatus, 'danger' | 'warning' | 'info' | 'muted'> = {
  bypasses: 'danger',
  'decides-first': 'warning',
  'not-applied': 'muted',
  'applies-after': 'info',
  'vdf-first': 'info',
}

// what the hosts' agents report, by VIF uuid; a stale agent's report is
// left out (what it saw may be long gone)
export function shadowedVifs(
  hosts: { status: VdfHostStatusDocument | undefined; state: VdfHostState }[]
): Map<string, VdfShadowedVif> {
  return new Map(
    hosts
      .filter(({ state }) => hostEnforces(state))
      .flatMap(({ status }) => (status?.shadowed ?? []).map(shadow => [shadow.vif, shadow] as const))
  )
}
