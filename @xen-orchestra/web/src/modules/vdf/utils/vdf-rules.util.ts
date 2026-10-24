import type { VdfDirection, VdfPolicy, VdfRule } from '@/modules/vdf/types.ts'

// RULE DIRECTIONS (vdf#53): ingress rules say what may reach a policy's
// VMs (from a source), egress rules what they may reach (to a destination)

export const VDF_DIRECTIONS: VdfDirection[] = ['ingress', 'egress']

export function rulesOf(policy: VdfPolicy, direction: VdfDirection): VdfRule[] {
  return direction === 'egress' ? (policy.egress ?? []) : policy.ingress
}

export function allRules(policy: VdfPolicy) {
  return [...policy.ingress, ...(policy.egress ?? [])]
}

// a policy without egress rules or default takes no part in egress
export function hasEgress(policy: VdfPolicy) {
  return (policy.egress?.length ?? 0) > 0 || policy.egressDefault !== undefined
}

// the rule's other end: its source, or an egress rule's destination
export const rulePeer = (rule: VdfRule) => rule.to ?? rule.from ?? ''

export const isEgressRule = (rule: VdfRule) => rule.to !== undefined

export function ruleDirection(policy: VdfPolicy, id: number): VdfDirection | undefined {
  for (const direction of VDF_DIRECTIONS) {
    if (rulesOf(policy, direction).some(rule => rule.id === id)) {
      return direction
    }
  }

  return undefined
}

// replaces a direction's rules; no egress rules and no egress default:
// the policy leaves egress out
export function setRules(policy: VdfPolicy, direction: VdfDirection, rules: VdfRule[]) {
  if (direction === 'ingress') {
    policy.ingress = rules
  } else if (rules.length > 0 || policy.egressDefault !== undefined) {
    policy.egress = rules
  } else {
    delete policy.egress
  }
}
