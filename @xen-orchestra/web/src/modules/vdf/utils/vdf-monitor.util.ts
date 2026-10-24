import type { VdfDocument, VdfMonitorEntry, VdfPolicy, VdfProtocol, VdfRule } from '@/modules/vdf/types.ts'
import { portsContain } from '@/modules/vdf/utils/vdf-ports.util.ts'
import { isEgressRule, rulesOf, setRules } from '@/modules/vdf/utils/vdf-rules.util.ts'

// a suggested allow rule, without its id (given when added to the draft):
// from a source, or for an egress would-be drop (vdf#53) to a destination
export type VdfSuggestedRule = { from?: string; to?: string; proto: VdfProtocol; ports?: number[] }

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
// An egress would-be drop gives an egress rule to its destination, named
// the same way. Most seen first.
export function suggestRules(
  entries: VdfMonitorEntry[],
  policy: VdfPolicy,
  sourceOf: (address: string) => string = address => address
): VdfSuggestion[] {
  const byKey = new Map<string, VdfSuggestion>()

  for (const entry of liveEntries(entries, policy.name)) {
    const proto = PROTOCOLS.find(candidate => candidate === entry.proto)
    const peer = entry.egress ? entry.dst : entry.src

    if (peer === undefined || peer === MONITOR_OTHER || proto === undefined) {
      continue
    }

    const ruleIds = new Set(rulesOf(policy, entry.egress ? 'egress' : 'ingress').map(rule => rule.id))
    const before = entry.rule !== undefined && entry.rule !== 0 && ruleIds.has(entry.rule) ? entry.rule : undefined
    const name = sourceOf(peer)
    const key = `${entry.egress ? 'to' : 'from'}|${name}|${proto}|${before ?? ''}`
    const suggestion = byKey.get(key) ?? {
      policy: policy.name,
      before,
      rule: entry.egress ? { to: name, proto } : { from: name, proto },
      entries: [],
      count: 0,
    }

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
// matching the flow's protocol, port and source (egress: its rules and the
// destination). groupsOf: the groups an address belongs to (static
// members, VM tags).
export function coveredBy(policy: VdfPolicy, entry: VdfMonitorEntry, groupsOf: (address: string) => string[]) {
  const all = rulesOf(policy, entry.egress ? 'egress' : 'ingress')
  const until = entry.rule ? all.findIndex(rule => rule.id === entry.rule) : -1
  const rules = until === -1 ? all : all.slice(0, until)
  const peer = (entry.egress ? entry.dst : entry.src) ?? ''
  const groups = new Set(groupsOf(peer))
  const peerOf = (rule: VdfRule) => (entry.egress ? rule.to : rule.from)

  return rules.some(
    rule =>
      (rule.action ?? 'allow') === 'allow' &&
      (rule.proto === 'any' || rule.proto === entry.proto) &&
      (entry.port === undefined ? (rule.ports ?? []).length === 0 : portsContain(rule.ports, entry.port)) &&
      (peerOf(rule) === 'any' || peerOf(rule) === peer || groups.has(peerOf(rule) ?? ''))
  )
}

// Inserts a new rule before another of the policy's rules of its direction
// (or at their end).
export function insertRule(policy: VdfPolicy, rule: VdfRule, before?: number) {
  const direction = isEgressRule(rule) ? 'egress' : 'ingress'
  const rules = [...rulesOf(policy, direction)]
  const index = before === undefined ? -1 : rules.findIndex(({ id }) => id === before)

  if (index === -1) {
    rules.push(rule)
  } else {
    rules.splice(index, 0, rule)
  }
  setRules(policy, direction, rules)
}
