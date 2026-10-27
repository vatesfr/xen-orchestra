import type { VdfDefaultAction, VdfDocument, VdfHostStatusDocument, VdfPolicy } from '@/modules/vdf/types.ts'
import { isMonitored } from '@/modules/vdf/utils/vdf-monitor.util.ts'
import { ruleAction, tierDefault, tierValue } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { rulesOf } from '@/modules/vdf/utils/vdf-rules.util.ts'

// One interface of a VM, with the groups that select it (its VM's tags,
// and for a group scoped to networks the interface's network, vdf#36)
export type VdfInterfaceGroups = { vm: string; vmName: string; groups: string[] }

// A monitored policy that can't see some of its VMs' traffic (vdf#86).
// Agents record what the monitored policies would drop in a what-if pass
// that takes them as enforced alongside the enforced ones (agent
// compile.go): tier by tier, one tier's policies merge, first matching rule
// wins, and the tier drops by default if one of them does. So a policy
// deciding first for the same VMs hides what the monitored one would drop:
// - same tier, an enforced policy: what its allow (or pass) rules match
//   never reaches the monitored default, and its default drop makes the
//   tier's (a drop that happens anyway, never recorded);
// - an earlier tier: what its policies' allow rules match is decided
//   there; when its default allows or drops, every new connection is, and
//   the monitored tier is never reached. A monitored policy there decides
//   too (the what-if pass takes it as enforced: what it would drop is
//   recorded under its own name).
export type VdfMonitorShadow = {
  // the monitored policy
  policy: string
  // the policy deciding first
  by: string
  // `by` is in monitor mode itself (an earlier tier's)
  byMonitored: boolean
  tier: number
  sameTier: boolean
  // 'default': by's default decides (a drop that happens anyway, or, in an
  // earlier tier, everything); 'rules': what by's rules match only
  kind: 'default' | 'rules'
  byDefault: VdfDefaultAction
  vms: { id: string; name: string }[]
}

// rules deciding before the tier's default: an allow, and in the same tier
// a pass (on to the next tier, past the monitored policy's default)
const hasRule = (policy: VdfPolicy, actions: string[]) =>
  rulesOf(policy, 'ingress').some(rule => actions.includes(ruleAction(rule)))

// inbound only: what the Monitor report lists for incoming connections
export function monitorShadows(document: VdfDocument, interfaces: VdfInterfaceGroups[]): VdfMonitorShadow[] {
  const monitored = document.policies.filter(isMonitored)

  if (monitored.length === 0) {
    return []
  }

  const byKey = new Map<string, VdfMonitorShadow>()

  const add = (
    policy: VdfPolicy,
    by: VdfPolicy,
    { sameTier, kind }: Pick<VdfMonitorShadow, 'sameTier' | 'kind'>,
    iface: VdfInterfaceGroups
  ) => {
    const key = `${policy.name}\0${by.name}\0${kind}`
    const shadow = byKey.get(key) ?? {
      policy: policy.name,
      by: by.name,
      byMonitored: isMonitored(by),
      tier: tierValue(by.tier),
      sameTier,
      kind,
      byDefault: by.default,
      vms: [],
    }

    if (!shadow.vms.some(item => item.id === iface.vm)) {
      shadow.vms.push({ id: iface.vm, name: iface.vmName })
    }
    byKey.set(key, shadow)
  }

  for (const iface of interfaces) {
    const groups = new Set(iface.groups)
    const onIface = document.policies.filter(policy => groups.has(policy.appliedTo))

    for (const policy of monitored.filter(candidate => groups.has(candidate.appliedTo))) {
      const tier = tierValue(policy.tier)
      const earlierTiers = [...new Set(onIface.map(other => tierValue(other.tier)))]
        .filter(value => value < tier)
        .sort((a, b) => a - b)
      let isDecided = false

      // earlier tiers in order, monitored policies included: their allow
      // rules, then their default when it decides everything (the agent's:
      // the first policy that drops, else that allows)
      for (const value of earlierTiers) {
        const policies = onIface.filter(other => tierValue(other.tier) === value)
        const action = tierDefault(policies)
        const decider = action === 'pass' ? undefined : policies.find(other => other.default === action)

        for (const other of policies) {
          if (other !== decider && hasRule(other, ['allow'])) {
            add(policy, other, { sameTier: false, kind: 'rules' }, iface)
          }
        }

        if (decider !== undefined) {
          add(policy, decider, { sameTier: false, kind: 'default' }, iface)
          isDecided = true
          break
        }
      }

      if (isDecided) {
        continue
      }

      for (const other of onIface) {
        if (isMonitored(other) || tierValue(other.tier) !== tier) {
          continue
        }

        if (other.default === 'drop') {
          add(policy, other, { sameTier: true, kind: 'default' }, iface)
        } else if (hasRule(other, ['allow', 'pass'])) {
          add(policy, other, { sameTier: true, kind: 'rules' }, iface)
        }
      }
    }
  }

  return [...byKey.values()]
}

// Whether the hosts' agents record what the monitored policy alone would
// drop where the shadow is (vdf#86): an isolated pass, the shadowed tier
// left to its monitored policies, gives the report's "alone" entries. Only
// for a same-tier shadow by an enforced policy (an earlier tier deciding
// first stays true once the policy is enforced), and only where the agent
// of each running VM's host reports the policy shadowed by it (vdf:status
// policies[].shadowedBy; agents before it don't), none of whose VIFs there
// went unchecked (shadowedUnchecked: past the agent's cap of shadowed
// tiers). statusOf: a VM's host status, `running` false for a VM that
// isn't.
export function isShadowCovered(
  shadow: VdfMonitorShadow,
  statusOf: (vmId: string) => { running: boolean; status?: VdfHostStatusDocument }
) {
  if (!shadow.sameTier || shadow.byMonitored) {
    return false
  }

  const running = shadow.vms.map(vm => statusOf(vm.id)).filter(vm => vm.running)

  return (
    running.length > 0 &&
    running.every(({ status }) =>
      (status?.policies ?? []).some(
        policy =>
          policy.name === shadow.policy &&
          (policy.shadowedBy ?? []).includes(shadow.by) &&
          !((policy.shadowedUnchecked ?? 0) > 0)
      )
    )
  )
}

// a shadow, the same from one document to the next (to tell the new ones)
export const shadowKey = (shadow: VdfMonitorShadow) =>
  `${shadow.policy}|${shadow.by}|${shadow.sameTier ? 'same' : 'earlier'}|${shadow.kind}`
