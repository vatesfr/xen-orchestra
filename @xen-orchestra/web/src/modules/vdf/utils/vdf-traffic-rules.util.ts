import type { VdfHostStatusDocument, VdfShadowedVif } from '@/modules/vdf/types.ts'

// XO's Traffic Rules (SDN controller) on a VM VDF protects (vdf#40): Open
// vSwitch applies them in table 0 at priority 32768, above VDF's flows, so
// for the packets they match they decide first. The agent reports the
// guarded VIFs such flows match (vdf:status `shadowed`).
// - bypasses: an allow, on a VIF where the agent found flows letting
//   traffic past VDF (its policies and quarantine);
// - decides-first: a drop, on a VIF where it found flows dropping traffic
//   VDF may allow;
// - not-applied: VDF doesn't apply it nor log it (the agent found nothing
//   there, or doesn't report it).
export type VdfTrafficRuleStatus = 'bypasses' | 'decides-first' | 'not-applied'

export function trafficRuleStatus(rule: { allow: boolean }, shadow: VdfShadowedVif | undefined): VdfTrafficRuleStatus {
  if (shadow !== undefined) {
    if (rule.allow && shadow.allows > 0) {
      return 'bypasses'
    }

    if (!rule.allow && shadow.drops > 0) {
      return 'decides-first'
    }
  }

  return 'not-applied'
}

// what the hosts' agents report, by VIF uuid
export function shadowedVifs(statuses: (VdfHostStatusDocument | undefined)[]): Map<string, VdfShadowedVif> {
  return new Map(statuses.flatMap(status => (status?.shadowed ?? []).map(shadow => [shadow.vif, shadow] as const)))
}
