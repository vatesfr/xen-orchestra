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
// groups scoped to networks (vdf#36) need version 7: agents before them
// must reject the document rather than widen the groups
export const VDF_NETWORKS_VERSION = 7

export function withFormatVersion(document: VdfDocument): VdfDocument {
  const required = Math.max(
    document.policies.some(isMonitored) ? VDF_MONITOR_VERSION : 0,
    Object.values(document.groups).some(group => (group.networks ?? []).length > 0) ? VDF_NETWORKS_VERSION : 0
  )
  // the versions this sets, which follow the document; others are kept
  const isManaged =
    document.version === undefined ||
    document.version === VDF_MONITOR_VERSION ||
    document.version === VDF_NETWORKS_VERSION

  if (required > 0) {
    return { ...document, version: isManaged ? required : Math.max(document.version ?? 0, required) }
  }

  if (document.version !== undefined && isManaged) {
    const copy = { ...document }

    delete copy.version

    return copy
  }

  return document
}

// what protects a VM: monitored policies don't
export const enforcedPolicies = (document: VdfDocument) => document.policies.filter(policy => !isMonitored(policy))

export const MONITOR_OTHER = 'other'

// entries that say something about a policy now: its own, not expired;
// what enforcing breaks now, or with `alone` (vdf#86) what it would drop
// once the enforced policies of its tier no longer apply
export function liveEntries(
  entries: VdfMonitorEntry[],
  policyName?: string,
  { alone = false }: { alone?: boolean } = {}
) {
  return entries.filter(
    entry =>
      !entry.expired && Boolean(entry.alone) === alone && (policyName === undefined || entry.policy === policyName)
  )
}

// flows of a policy last seen since a time (the warning before enforcing:
// what it breaks now, not its alone entries)
export function seenSince(
  entries: VdfMonitorEntry[],
  policyName: string,
  since: number,
  options?: { alone?: boolean }
) {
  return liveEntries(entries, policyName, options).filter(entry => Date.parse(entry.last) >= since)
}

// A policy's alone entries (vdf#86), by the enforced policies that decide
// first today and their tier (one isolated pass per shadowed tier): what it
// would drop once those no longer apply to the VMs
// shadowedTier: the tier of shadowedBy (absent from agents before one pass
// per shadowed tier); `earlier`: it's before the policy's own, the policy
// reached once those no longer decide first
export type VdfAloneGroup = {
  policy: string
  shadowedBy: string[]
  shadowedTier?: string
  earlier: boolean
  entries: VdfMonitorEntry[]
}

// what the review before enforcing says of a policy's alone entries: per
// set of enforced policies deciding first, the flows seen since a time
// that `keep` keeps (not expected, not covered by the draft), if any
export function aloneSince(
  entries: VdfMonitorEntry[],
  policyName: string,
  since: number,
  keep: (entry: VdfMonitorEntry) => boolean = () => true
) {
  return aloneGroups(entries, policyName).flatMap(({ shadowedBy, shadowedTier, earlier, entries: groupEntries }) => {
    const count = groupEntries.filter(entry => Date.parse(entry.last) >= since && keep(entry)).length

    return count === 0 ? [] : [{ shadowedBy, shadowedTier, earlier, count }]
  })
}

export function aloneGroups(entries: VdfMonitorEntry[], policyName?: string): VdfAloneGroup[] {
  const byKey = new Map<string, VdfAloneGroup>()

  for (const entry of liveEntries(entries, policyName, { alone: true })) {
    const shadowedBy = [...(entry.shadowedBy ?? [])].sort()
    const key = `${entry.policy}\0${entry.shadowedTier ?? ''}\0${shadowedBy.join('\0')}`
    const group = byKey.get(key) ?? {
      policy: entry.policy,
      shadowedBy,
      shadowedTier: entry.shadowedTier,
      earlier: entry.shadowedTier !== undefined && entry.shadowedTier !== entry.tier,
      entries: [],
    }

    group.entries.push(entry)
    byKey.set(key, group)
  }

  return [...byKey.values()].sort(
    (a, b) =>
      a.policy.localeCompare(b.policy) ||
      (a.shadowedTier ?? '').localeCompare(b.shadowedTier ?? '') ||
      a.shadowedBy.join().localeCompare(b.shadowedBy.join())
  )
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
// `alone`: from its alone entries (vdf#86) instead.
export function suggestRules(
  entries: VdfMonitorEntry[],
  policy: VdfPolicy,
  sourceOf: (address: string) => string = address => address,
  { alone = false }: { alone?: boolean } = {}
): VdfSuggestion[] {
  const byKey = new Map<string, VdfSuggestion>()

  for (const entry of liveEntries(entries, policy.name, { alone })) {
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
  return coveringRule(policy, entry, groupsOf) !== undefined
}

// the rule of coveredBy: the first rule before what would drop that matches
// the flow, if it allows (a drop or a pass matching first decides
// otherwise). The policy's own rules only: an earlier tier may decide first.
export function coveringRule(
  policy: VdfPolicy,
  entry: VdfMonitorEntry,
  groupsOf: (address: string) => string[]
): VdfRule | undefined {
  const all = rulesOf(policy, entry.egress ? 'egress' : 'ingress')
  const until = entry.rule ? all.findIndex(rule => rule.id === entry.rule) : -1
  const rules = until === -1 ? all : all.slice(0, until)
  const peer = (entry.egress ? entry.dst : entry.src) ?? ''
  const groups = new Set(groupsOf(peer))
  const peerOf = (rule: VdfRule) => (entry.egress ? rule.to : rule.from)

  const first = rules.find(
    rule =>
      (rule.proto === 'any' || rule.proto === entry.proto) &&
      (entry.port === undefined ? (rule.ports ?? []).length === 0 : portsContain(rule.ports, entry.port)) &&
      (peerOf(rule) === 'any' || peerOf(rule) === peer || groups.has(peerOf(rule) ?? ''))
  )

  return first !== undefined && (first.action ?? 'allow') === 'allow' ? first : undefined
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

// A flow of the report, the same from one poll to the next: what "Expected"
// remembers (vdf#13)
export const monitorFlowKey = (entry: VdfMonitorEntry) =>
  [
    entry.policy,
    entry.egress ? 'out' : 'in',
    entry.src,
    entry.dst ?? '',
    entry.vm,
    entry.proto,
    entry.port ?? '',
    entry.rule ?? '',
    // vdf#86: the same flow, as what the policy alone would drop
    // (one isolated pass per shadowed tier: its own flow)
    ...(entry.alone === true ? ['alone', ...(entry.shadowedTier === undefined ? [] : [entry.shadowedTier])] : []),
  ].join('|')

// Flows marked expected (a drop that's wanted: no rule to add), by key,
// with when: marking one keeps the newest `max`, unmarking removes it.
export function markExpected(
  expected: Record<string, number>,
  key: string,
  isExpected: boolean,
  { now = Date.now(), max = 2000 }: { now?: number; max?: number } = {}
): Record<string, number> {
  const next = { ...expected }

  if (!isExpected) {
    delete next[key]

    return next
  }

  next[key] = now

  const keys = Object.keys(next)

  if (keys.length > max) {
    for (const old of keys.sort((a, b) => next[a] - next[b]).slice(0, keys.length - max)) {
      delete next[old]
    }
  }

  return next
}
