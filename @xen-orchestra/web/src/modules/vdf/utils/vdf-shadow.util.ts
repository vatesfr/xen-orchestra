import type { VdfDefaultAction, VdfDocument, VdfPolicy } from '@/modules/vdf/types.ts'
import { isMonitored } from '@/modules/vdf/utils/vdf-monitor.util.ts'
import { ruleAction, tierDefault, tierValue } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { rulesOf } from '@/modules/vdf/utils/vdf-rules.util.ts'

// One interface of a VM, with the groups that select it (its VM's tags,
// and for a group scoped to networks the interface's network, vdf#36)
export type VdfInterfaceGroups = { vm: string; vmName: string; groups: string[] }

// A monitored policy that can't see some of its VMs' traffic (vdf#86).
// Agents record what the monitored policies would drop in a what-if pass
// that takes them as enforced alongside the enforced ones (agent
// compile.go): one tier's policies merge, first matching rule wins, and the
// tier drops by default if one of them does. So an enforced policy deciding
// for the same VMs hides what the monitored one would drop:
// - same tier: what its allow rules match is allowed before the monitored
//   default is reached, and its default drop makes the tier's (a drop that
//   happens anyway, never recorded);
// - an earlier tier whose default allows or drops: every new connection is
//   decided there, the monitored tier is never reached.
export type VdfMonitorShadow = {
  // the monitored policy
  policy: string
  // the enforced policy deciding first
  by: string
  tier: number
  sameTier: boolean
  // by's default: in the same tier, a drop hides every default drop of the
  // monitored policy, else only what by's rules allow
  byDefault: VdfDefaultAction
  vms: { id: string; name: string }[]
}

const hasAllowRule = (policy: VdfPolicy) => rulesOf(policy, 'ingress').some(rule => ruleAction(rule) === 'allow')

// inbound only: what the Monitor report lists for incoming connections
export function monitorShadows(document: VdfDocument, interfaces: VdfInterfaceGroups[]): VdfMonitorShadow[] {
  const monitored = document.policies.filter(isMonitored)

  if (monitored.length === 0) {
    return []
  }

  const enforced = document.policies.filter(policy => !isMonitored(policy))
  const byKey = new Map<string, VdfMonitorShadow>()

  const add = (policy: VdfPolicy, by: VdfPolicy, sameTier: boolean, vm: string, vmName: string) => {
    const key = `${policy.name}\0${by.name}`
    const shadow = byKey.get(key) ?? {
      policy: policy.name,
      by: by.name,
      tier: tierValue(by.tier),
      sameTier,
      byDefault: by.default,
      vms: [],
    }

    if (!shadow.vms.some(item => item.id === vm)) {
      shadow.vms.push({ id: vm, name: vmName })
    }
    byKey.set(key, shadow)
  }

  for (const iface of interfaces) {
    const groups = new Set(iface.groups)
    const onIface = enforced.filter(policy => groups.has(policy.appliedTo))

    for (const policy of monitored.filter(candidate => groups.has(candidate.appliedTo))) {
      const tier = tierValue(policy.tier)

      // the first earlier tier deciding everything (agent: its default
      // comes from the first policy that drops, else that allows)
      const earlier = [...new Set(onIface.map(other => tierValue(other.tier)))]
        .filter(value => value < tier)
        .sort((a, b) => a - b)
        .map(value => onIface.filter(other => tierValue(other.tier) === value))
        .find(policies => tierDefault(policies) !== 'pass')

      if (earlier !== undefined) {
        const action = tierDefault(earlier)

        add(policy, earlier.find(other => other.default === action)!, false, iface.vm, iface.vmName)
        continue
      }

      for (const other of onIface) {
        if (tierValue(other.tier) === tier && (other.default === 'drop' || hasAllowRule(other))) {
          add(policy, other, true, iface.vm, iface.vmName)
        }
      }
    }
  }

  return [...byKey.values()]
}

// a shadow, the same from one document to the next (to tell the new ones)
export const shadowKey = (shadow: VdfMonitorShadow) =>
  `${shadow.policy}|${shadow.by}|${shadow.sameTier ? 'same' : 'earlier'}|${shadow.byDefault}`
