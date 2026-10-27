import type { VdfDocument, VdfMonitorEntry, VdfPolicy } from '@/modules/vdf/types.ts'
import {
  aloneGroups,
  aloneSince,
  coveredBy,
  coveringRule,
  enforcedPolicies,
  insertRule,
  liveEntries,
  markExpected,
  monitorFlowKey,
  seenSince,
  suggestRules,
  withFormatVersion,
} from '@/modules/vdf/utils/vdf-monitor.util.ts'
import { serializeDocument } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { describe, expect, it } from 'vitest'

const policy = (fields: Partial<VdfPolicy> = {}): VdfPolicy => ({
  name: 'db',
  appliedTo: 'db',
  default: 'drop',
  ingress: [
    { id: 1, from: 'app', proto: 'tcp', ports: [5432] },
    { id: 2, action: 'drop', from: 'any', proto: 'tcp', ports: [22] },
  ],
  ...fields,
})

const entry = (fields: Partial<VdfMonitorEntry>): VdfMonitorEntry => ({
  src: '10.0.0.7',
  vm: 'vm-db',
  vmName: 'db',
  proto: 'tcp',
  port: 9100,
  policy: 'db',
  tier: 'application',
  count: 1,
  first: '2026-10-24T10:00:00Z',
  last: '2026-10-24T10:00:00Z',
  ...fields,
})

describe('withFormatVersion', () => {
  const doc = (policies: VdfPolicy[], version?: number): VdfDocument => ({ version, groups: {}, policies })

  it('is version 4 with a monitored policy, as agents require', () => {
    expect(withFormatVersion(doc([policy({ mode: 'monitor' })])).version).toBe(4)
    expect(JSON.parse(serializeDocument(doc([policy({ mode: 'monitor' })]))).version).toBe(4)
  })

  it('drops a version 4 nothing needs any more, keeps others', () => {
    expect('version' in withFormatVersion(doc([policy()], 4))).toBe(false)
    expect(withFormatVersion(doc([policy()], 3)).version).toBe(3)
  })

  it('is version 7 with a group scoped to networks (vdf#36), down again without', () => {
    const scoped = (version?: number): VdfDocument => ({
      ...doc([policy({ mode: 'monitor' })], version),
      groups: { web: { tags: ['vdf:role=web'], networks: ['vdf:net=dmz'] } },
    })

    expect(withFormatVersion(scoped()).version).toBe(7)
    expect(withFormatVersion(scoped(4)).version).toBe(7)
    expect(withFormatVersion(doc([policy({ mode: 'monitor' })], 7)).version).toBe(4)
    expect('version' in withFormatVersion(doc([policy()], 7))).toBe(false)
  })

  it('leaves monitored policies out of what protects', () => {
    expect(enforcedPolicies(doc([policy(), policy({ name: 'm', mode: 'monitor' })])).map(p => p.name)).toEqual(['db'])
  })
})

describe('suggestRules', () => {
  it('merges ports per source, names the source by group, puts allows before the rule that drops', () => {
    const suggestions = suggestRules(
      [
        entry({ port: 9100, count: 5 }),
        entry({ port: 9101, count: 2 }),
        entry({ src: '10.0.0.8', port: 22, rule: 2, count: 1 }),
        entry({ src: 'other', port: 80, count: 99 }), // past the quota: not a source
        entry({ policy: 'web', count: 50 }), // another policy
        entry({ port: 7, expired: true, count: 50 }), // no longer monitored
        entry({ proto: 'icmp', port: undefined, count: 3 }),
      ],
      policy(),
      address => (address === '10.0.0.7' ? 'monitoring' : address)
    )
    expect(suggestions).toEqual([
      expect.objectContaining({
        before: undefined,
        rule: { from: 'monitoring', proto: 'tcp', ports: [9100, 9101] },
        count: 7,
      }),
      expect.objectContaining({ before: undefined, rule: { from: 'monitoring', proto: 'icmp' }, count: 3 }),
      expect.objectContaining({ before: 2, rule: { from: '10.0.0.8', proto: 'tcp', ports: [22] }, count: 1 }),
    ])
  })

  it('a pass rule of the policy is a place too; an unknown rule id falls back to the end', () => {
    const [pass, gone] = suggestRules(
      [entry({ rule: 1, pass: true, count: 2 }), entry({ src: '10.0.0.9', rule: 42 })],
      policy()
    )
    expect(pass.before).toBe(1)
    expect(gone.before).toBeUndefined()
  })
})

describe('insertRule', () => {
  it('inserts before a rule, or at the end', () => {
    const p = policy()
    insertRule(p, { id: 3, from: 'x', proto: 'tcp' }, 2)
    insertRule(p, { id: 4, from: 'y', proto: 'tcp' })
    insertRule(p, { id: 5, from: 'z', proto: 'tcp' }, 99)
    expect(p.ingress.map(rule => rule.id)).toEqual([1, 3, 2, 4, 5])
  })
})

describe('seenSince', () => {
  it('counts the live flows of a policy since a time', () => {
    const entries = [
      entry({ last: '2026-10-24T10:00:00Z' }),
      entry({ last: '2026-10-23T09:00:00Z' }),
      entry({ last: '2026-10-24T11:00:00Z', expired: true }),
    ]
    expect(seenSince(entries, 'db', Date.parse('2026-10-23T10:00:00Z'))).toHaveLength(1)
  })
})

describe('coveredBy', () => {
  const groupsOf = (address: string) => (address === '10.0.0.7' ? ['monitoring'] : [])

  it('an allow before the dropping rule, matching source, protocol and port, covers the flow', () => {
    const p = policy()
    p.ingress.unshift({ id: 9, from: 'monitoring', proto: 'tcp', ports: [22] })
    expect(coveredBy(p, entry({ port: 22, rule: 2 }), groupsOf)).toBe(true)
    expect(coveredBy(p, entry({ src: '10.0.0.8', port: 22, rule: 2 }), groupsOf)).toBe(false) // another source
    expect(coveredBy(p, entry({ port: 23, rule: 2 }), groupsOf)).toBe(false) // another port
  })

  it('a port range covers the ports in it (vdf#54)', () => {
    const p = policy()
    p.ingress.unshift({ id: 9, from: 'monitoring', proto: 'tcp', ports: [22, '8000-8099'] })
    expect(coveredBy(p, entry({ port: 8000, rule: 2 }), groupsOf)).toBe(true)
    expect(coveredBy(p, entry({ port: 8099, rule: 2 }), groupsOf)).toBe(true)
    expect(coveredBy(p, entry({ port: 8100, rule: 2 }), groupsOf)).toBe(false)
  })

  it('an allow after the dropping rule covers nothing; an allow matching first covers the default', () => {
    const p = policy()
    p.ingress.push({ id: 9, from: 'any', proto: 'tcp', ports: [22, 9100] })
    expect(coveredBy(p, entry({ port: 22, rule: 2 }), groupsOf)).toBe(false)
    expect(coveredBy(p, entry({ port: 9100 }), groupsOf)).toBe(true)
    // rule 2 drops tcp 22 first, whatever comes after
    expect(coveredBy(p, entry({ port: 22 }), groupsOf)).toBe(false)
  })

  it('coveringRule names the first allow that covers it', () => {
    const p = policy()
    p.ingress.push({ id: 9, from: 'monitoring', proto: 'tcp', ports: [9100] }, { id: 10, from: 'any', proto: 'any' })
    expect(coveringRule(p, entry({}), groupsOf)?.id).toBe(9)
    expect(coveringRule(p, entry({ src: '10.0.0.8' }), groupsOf)?.id).toBe(10)
    expect(coveringRule(policy(), entry({}), groupsOf)).toBeUndefined()
  })

  it('the first matching rule decides: a drop or a pass before the allow covers nothing', () => {
    const p = policy({
      ingress: [
        { id: 1, action: 'drop', from: 'bad', proto: 'tcp', ports: [22] },
        { id: 2, from: 'any', proto: 'tcp', ports: [22] },
      ],
    })
    expect(coveringRule(p, entry({ port: 22 }), () => ['bad'])).toBeUndefined()
    expect(coveringRule(p, entry({ port: 22 }), () => [])?.id).toBe(2)
    p.ingress[0].action = 'pass'
    expect(coveringRule(p, entry({ port: 22 }), () => ['bad'])).toBeUndefined()
  })
})

describe('monitorFlowKey', () => {
  it('is the same for the same flow from one poll to the next', () => {
    expect(monitorFlowKey(entry({ count: 3, last: '2026-10-25T10:00:00Z' }))).toBe(monitorFlowKey(entry({ count: 9 })))
  })

  it('tells flows apart by policy, direction, ends, service and rule', () => {
    const keys = [
      entry({}),
      entry({ policy: 'other' }),
      entry({ egress: true, dst: '10.0.0.7' }),
      entry({ src: '10.0.0.8' }),
      entry({ vm: 'vm-app' }),
      entry({ proto: 'udp' }),
      entry({ port: 22 }),
      entry({ rule: 2 }),
    ].map(monitorFlowKey)

    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('markExpected', () => {
  it('marks and unmarks a flow, leaving the record given as is', () => {
    const before = { a: 1 }
    const marked = markExpected(before, 'b', true, { now: 2 })

    expect(marked).toEqual({ a: 1, b: 2 })
    expect(before).toEqual({ a: 1 })
    expect(markExpected(marked, 'a', false)).toEqual({ b: 2 })
    expect(markExpected(marked, 'c', false)).toEqual(marked)
  })

  it('keeps the newest ones past its bound', () => {
    expect(markExpected({ a: 1, b: 3, c: 2 }, 'd', true, { now: 4, max: 2 })).toEqual({ b: 3, d: 4 })
  })
})

// vdf#86: what a policy alone would drop, once the enforced policies of its
// tier no longer apply, comes in "alone" entries apart from what enforcing
// breaks now; older agents send none
describe('alone entries', () => {
  const now = entry({ port: 9100 })
  const alone = entry({ port: 6379, alone: true, shadowedBy: ['web'], count: 3 })
  const aloneApi = entry({ port: 6380, alone: true, shadowedBy: ['web', 'api'] })
  const entries = [now, alone, aloneApi, entry({ alone: true, shadowedBy: ['web'], expired: true })]

  it('stay out of the live entries, the enforce warning and the main suggestions', () => {
    expect(liveEntries(entries)).toEqual([now])
    expect(seenSince(entries, 'db', 0)).toEqual([now])
    expect(suggestRules(entries, policy()).map(suggestion => suggestion.rule.ports)).toEqual([[9100]])
  })

  it('give their own suggestions, as for the others', () => {
    expect(liveEntries(entries, 'db', { alone: true })).toEqual([alone, aloneApi])
    expect(seenSince(entries, 'db', 0, { alone: true })).toEqual([alone, aloneApi])
    expect(suggestRules(entries, policy(), undefined, { alone: true })).toMatchObject([
      { rule: { from: '10.0.0.7', proto: 'tcp', ports: [6379, 6380] }, count: 4 },
    ])
    // coveringRule takes them as any entry
    expect(coveringRule(policy(), { ...alone, src: '10.0.0.7', port: 5432 }, () => ['app'])?.id).toBe(1)
  })

  it('are grouped by policy and the enforced policies deciding first', () => {
    expect(aloneGroups(entries)).toEqual([
      { policy: 'db', shadowedBy: ['api', 'web'], earlier: false, entries: [aloneApi] },
      { policy: 'db', shadowedBy: ['web'], earlier: false, entries: [alone] },
    ])
    expect(aloneGroups([now])).toEqual([])
  })

  it('the review before enforcing counts them apart, per enforced policies deciding first', () => {
    const since = Date.parse('2026-10-24T09:00:00Z')

    expect(aloneSince(entries, 'db', since)).toEqual([
      { shadowedBy: ['api', 'web'], earlier: false, count: 1 },
      { shadowedBy: ['web'], earlier: false, count: 1 },
    ])
    // not expected, not covered by the draft: what `keep` keeps
    expect(aloneSince(entries, 'db', since, item => item.port !== 6380)).toEqual([
      { shadowedBy: ['web'], earlier: false, count: 1 },
    ])
    // seen before: nothing
    expect(aloneSince(entries, 'db', Date.parse('2026-10-25T00:00:00Z'))).toEqual([])
  })

  it('have their own flow key; the others keep theirs', () => {
    const same = entry({ port: 9100, alone: true, shadowedBy: ['web'] })

    expect(monitorFlowKey(same)).not.toBe(monitorFlowKey(now))
    expect(monitorFlowKey(now)).toBe('db|in|10.0.0.7||vm-db|tcp|9100|')
  })
})

// agents since 8767985: one isolated pass per shadowed tier, the policy's
// own or an earlier one (a later-tier policy reached once it no longer decides)
describe('alone entries per shadowed tier', () => {
  const own = entry({ port: 6379, alone: true, shadowedBy: ['web'], shadowedTier: 'application' })
  const earlier = entry({ port: 6379, alone: true, shadowedBy: ['e25'], shadowedTier: 'securityops' })
  // an agent before shadowedTier
  const legacy = entry({ port: 6379, alone: true, shadowedBy: ['web'] })

  it('are grouped per policy, shadowed tier and enforced policies', () => {
    expect(aloneGroups([own, earlier, legacy])).toEqual([
      { policy: 'db', shadowedBy: ['web'], earlier: false, entries: [legacy] },
      { policy: 'db', shadowedBy: ['web'], shadowedTier: 'application', earlier: false, entries: [own] },
      { policy: 'db', shadowedBy: ['e25'], shadowedTier: 'securityops', earlier: true, entries: [earlier] },
    ])
    expect(aloneSince([own, earlier], 'db', 0)).toEqual([
      { shadowedBy: ['web'], shadowedTier: 'application', earlier: false, count: 1 },
      { shadowedBy: ['e25'], shadowedTier: 'securityops', earlier: true, count: 1 },
    ])
  })

  it('have a flow key per shadowed tier; one without keeps its key', () => {
    expect(new Set([own, earlier, legacy].map(monitorFlowKey)).size).toBe(3)
    expect(monitorFlowKey(legacy)).toBe('db|in|10.0.0.7||vm-db|tcp|6379||alone')
  })
})
