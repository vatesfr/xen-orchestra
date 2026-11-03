import type { VdfHostState, VdfHostStatusDocument, VdfShadowedVif } from '@/modules/vdf/types.ts'
import { hostEnforces } from '@/modules/vdf/utils/vdf-status.util.ts'

// XO's Traffic Rules (SDN controller) on a VM VDF guards (vdf#40, vdf#102).
// Agents that put VDF's flows above Traffic Rules (status
// `aboveTrafficRules`):
// - vdf-first: an allow, which can't let anything past VDF, deciding first;
// - applies-after: a drop, which applies after VDF's decision, on every
//   path: the traffic needs both;
// - never-applies: a drop at priority 9900 or below (XO 9.10's XAPI
//   plugin mode takes one, 32768 without) under an agent whose Traffic
//   Rules' pass ends at 9900 (no `trafficRulesAnyPriority`, vdf#114): it
//   never applies to the VM.
// Older agents leave them in table 0 at priority 32768, above VDF's flows:
// - not-applied: VDF doesn't apply it nor log it, and for the traffic it
//   matches it decides first.
// Either way, flows the agent found deciding before VDF (status
// `shadowed`, a foreign controller's or an older agent's view):
// - bypasses: an allow letting traffic past VDF;
// - decides-first: a drop of traffic VDF may allow.
export type VdfTrafficRuleStatus =
  | 'bypasses'
  | 'decides-first'
  | 'never-applies'
  | 'not-applied'
  | 'applies-after'
  | 'vdf-first'

// the statuses of a Traffic Rule that decides before VDF's policies: what
// to warn about when they start protecting its VM
export const TRAFFIC_RULE_DECIDES_FIRST: VdfTrafficRuleStatus[] = ['bypasses', 'decides-first', 'not-applied']

// where agents before vdf#114 end the Traffic Rules' pass: a rule at or
// below it is never reached; a rule without a priority has OVS's default
const OLD_TRAFFIC_RULES_PASS_END = 9900
const DEFAULT_TRAFFIC_RULE_PRIORITY = 32768

// rule.priority: stored with the rule by the SDN controller's XAPI plugin
// mode (XO 9.10), not in XO 6's TrafficRule type yet
export function trafficRuleStatus(
  rule: { allow: boolean; priority?: number },
  shadow: VdfShadowedVif | undefined,
  aboveTrafficRules = false,
  anyPriority = false
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
    if (rule.allow) {
      return 'vdf-first'
    }

    return anyPriority || (rule.priority ?? DEFAULT_TRAFFIC_RULE_PRIORITY) > OLD_TRAFFIC_RULES_PASS_END
      ? 'applies-after'
      : 'never-applies'
  }

  return 'not-applied'
}

// most telling first: a rule of a network covers several VIFs, it takes the
// status of the one that matters most
export const TRAFFIC_RULE_SEVERITY: VdfTrafficRuleStatus[] = [
  'bypasses',
  'decides-first',
  'never-applies',
  'not-applied',
  'applies-after',
  'vdf-first',
]

export const mostSevere = (statuses: VdfTrafficRuleStatus[]) =>
  TRAFFIC_RULE_SEVERITY.find(status => statuses.includes(status))

export const TRAFFIC_RULE_ACCENTS: Record<VdfTrafficRuleStatus, 'danger' | 'warning' | 'info' | 'muted'> = {
  bypasses: 'danger',
  'decides-first': 'warning',
  'never-applies': 'warning',
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
