import type { VdfDocument, VdfMonitorEntry, VdfPolicy, VdfProtocol, VdfRule } from '@/modules/vdf/types.ts'

// a suggested allow rule, without its id (given when added to the draft)
export type VdfSuggestedRule = { from: string; proto: VdfProtocol; ports?: number[] }

// Monitor mode (vdf#13): a policy that decides nothing; the hosts record
// what it would drop if enforced.

export const VDF_MONITOR_VERSION = 4

export const isMonitored = (policy: Pick<VdfPolicy, 'mode'>) => policy.mode === 'monitor'

// The document as published: version 4 when a policy is monitored (agents
// before monitor mode reject it, and get it without the monitored policies
// from the newer agents' publish); without a version 4 that nothing needs
// any more.
export function withFormatVersion(document: VdfDocument): VdfDocument {
  if (document.policies.some(isMonitored)) {
    return { ...document, version: Math.max(document.version ?? 0, VDF_MONITOR_VERSION) }
  }

  if (document.version === VDF_MONITOR_VERSION) {
    const copy = { ...document }

    delete copy.version

    return copy
  }

  return document
}

// what protects a VM: monitored policies don't
export const enforcedPolicies = (document: VdfDocument) => document.policies.filter(policy => !isMonitored(policy))

export const MONITOR_OTHER = 'other'

// entries that say something about a policy now: its own, not expired
export function liveEntries(entries: VdfMonitorEntry[], policyName?: string) {
  return entries.filter(entry => !entry.expired && (policyName === undefined || entry.policy === policyName))
}

// flows of a policy last seen since a time (the warning before enforcing)
export function seenSince(entries: VdfMonitorEntry[], policyName: string, since: number) {
  return liveEntries(entries, policyName).filter(entry => Date.parse(entry.last) >= since)
}

export type VdfSuggestion = {
  policy: string
  // the rule the would-be drop comes from (a drop or a pass): the allow goes
  // before it, first match wins; undefined: the policy's default, at the end
  before?: number
  rule: VdfSuggestedRule
  entries: VdfMonitorEntry[]
  count: number
}

const PROTOCOLS: VdfProtocol[] = ['tcp', 'udp', 'icmp']

// Suggested allow rules for a policy's would-be drops: one per source,
// protocol and position, ports merged; the source is what sourceOf names
// for the address (a group its VM belongs to), else the address itself.
// Most seen first.
export function suggestRules(
  entries: VdfMonitorEntry[],
  policy: VdfPolicy,
  sourceOf: (address: string) => string = address => address
): VdfSuggestion[] {
  const ruleIds = new Set(policy.ingress.map(rule => rule.id))
  const byKey = new Map<string, VdfSuggestion>()

  for (const entry of liveEntries(entries, policy.name)) {
    const proto = PROTOCOLS.find(candidate => candidate === entry.proto)

    if (entry.src === MONITOR_OTHER || proto === undefined) {
      continue
    }

    const before = entry.rule !== undefined && entry.rule !== 0 && ruleIds.has(entry.rule) ? entry.rule : undefined
    const from = sourceOf(entry.src)
    const key = `${from}|${proto}|${before ?? ''}`
    const suggestion = byKey.get(key) ?? { policy: policy.name, before, rule: { from, proto }, entries: [], count: 0 }

    if (proto !== 'icmp' && entry.port !== undefined && entry.port !== 0) {
      const ports = new Set(suggestion.rule.ports ?? [])

      ports.add(entry.port)
      suggestion.rule.ports = [...ports].sort((a, b) => a - b)
    }

    suggestion.entries.push(entry)
    suggestion.count += entry.count
    byKey.set(key, suggestion)
  }

  return [...byKey.values()].sort((a, b) => b.count - a.count)
}

// Whether a policy allows a would-be drop before what would drop it: an
// allow rule placed before the dropping rule (anywhere, for the default)
// matching the flow's protocol, port and source. groupsOf: the groups the
// source address belongs to (static members, VM tags).
export function coveredBy(policy: VdfPolicy, entry: VdfMonitorEntry, groupsOf: (address: string) => string[]) {
  const until = entry.rule ? policy.ingress.findIndex(rule => rule.id === entry.rule) : -1
  const rules = until === -1 ? policy.ingress : policy.ingress.slice(0, until)
  const groups = new Set(groupsOf(entry.src))

  return rules.some(
    rule =>
      (rule.action ?? 'allow') === 'allow' &&
      (rule.proto === 'any' || rule.proto === entry.proto) &&
      (rule.ports === undefined ||
        rule.ports.length === 0 ||
        (entry.port !== undefined && rule.ports.includes(entry.port))) &&
      (rule.from === 'any' || rule.from === entry.src || groups.has(rule.from))
  )
}

// Inserts a new rule before another of the policy (or at its end).
export function insertRule(policy: VdfPolicy, rule: VdfRule, before?: number) {
  const index = before === undefined ? -1 : policy.ingress.findIndex(({ id }) => id === before)

  if (index === -1) {
    policy.ingress.push(rule)
  } else {
    policy.ingress.splice(index, 0, rule)
  }
}
