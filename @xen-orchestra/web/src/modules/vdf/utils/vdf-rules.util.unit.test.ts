import type { VdfDocument, VdfPolicy } from '@/modules/vdf/types.ts'
import { changeDetails, publishWarnings } from '@/modules/vdf/utils/vdf-change.util.ts'
import { mergeDocuments } from '@/modules/vdf/utils/vdf-merge.util.ts'
import { coveredBy, insertRule, suggestRules } from '@/modules/vdf/utils/vdf-monitor.util.ts'
import {
  diffDocuments,
  filterRuleBase,
  groupUsage,
  moveRule,
  nextRuleId,
  ruleBase,
  tierDefault,
} from '@/modules/vdf/utils/vdf-policy.util.ts'
import { allRules, hasEgress, ruleDirection, rulePeer, setRules } from '@/modules/vdf/utils/vdf-rules.util.ts'
import { describe, expect, it } from 'vitest'

// Egress rules (vdf#53): what a policy's VMs may reach

const app = (fields: Partial<VdfPolicy> = {}): VdfPolicy => ({
  name: 'app',
  appliedTo: 'app',
  default: 'drop',
  ingress: [{ id: 1, from: 'web', proto: 'tcp', ports: [8080] }],
  egress: [
    { id: 2, to: 'db', proto: 'tcp', ports: [5432] },
    { id: 3, action: 'drop', to: 'any', proto: 'tcp', ports: [25] },
  ],
  egressDefault: 'drop',
  ...fields,
})

const doc = (...policies: VdfPolicy[]): VdfDocument => ({
  groups: { web: { tags: ['role=web'] }, app: { tags: ['role=app'] }, db: { tags: ['role=db'] } },
  policies,
})

describe('rule directions', () => {
  it('tells the rules apart', () => {
    const policy = app()
    expect(allRules(policy).map(rule => rule.id)).toEqual([1, 2, 3])
    expect([ruleDirection(policy, 1), ruleDirection(policy, 3), ruleDirection(policy, 9)]).toEqual([
      'ingress',
      'egress',
      undefined,
    ])
    expect(policy.egress!.map(rulePeer)).toEqual(['db', 'any'])
    expect(hasEgress(app({ egress: undefined, egressDefault: undefined }))).toBe(false)
    expect(hasEgress(app({ egress: [], egressDefault: undefined }))).toBe(false)
    expect(hasEgress(app({ egress: undefined }))).toBe(true)
  })

  it('leaves egress out when it has nothing', () => {
    const policy = app({ egressDefault: undefined })
    setRules(policy, 'egress', [])
    expect('egress' in policy).toBe(false)
    const withDefault = app()
    setRules(withDefault, 'egress', [])
    expect(withDefault.egress).toEqual([])
  })

  it('takes egress into rule ids, group usage and tier defaults', () => {
    const document = doc(app(), { name: 'db', appliedTo: 'db', default: 'pass', ingress: [] })
    expect(nextRuleId(document)).toBe(4)
    expect(groupUsage(document, 'db').sourceOf).toEqual(['app'])
    expect(tierDefault(document.policies, 'egress')).toBe('drop')
    expect(tierDefault([document.policies[1]], 'egress')).toBe('pass')
  })
})

describe('rule base and diff', () => {
  it('lists egress rules apart, with their draft state', () => {
    const published = doc(app())
    const draft = doc(
      app({
        egress: [
          { id: 4, to: 'db', proto: 'udp' },
          { id: 2, to: 'db', proto: 'tcp', ports: [5433] },
        ],
      })
    )
    const [tier] = ruleBase(draft, published).filter(t => t.policies.length > 0)
    expect(tier.egressDefault).toBe('drop')
    expect(tier.policies[0].rules.map(({ rule, state }) => [rule.id, state])).toEqual([[1, undefined]])
    expect(tier.policies[0].egressRules.map(({ rule, state }) => [rule.id, state])).toEqual([
      [4, 'new'],
      [2, 'modified'],
      [3, 'removed'],
    ])
    expect(diffDocuments(published, draft).map(c => `${c.type}:${c.label}`)).toEqual([
      'added:4',
      'modified:2',
      'removed:3',
    ])
    // search: "outbound" finds egress rules
    const found = filterRuleBase(ruleBase(published, published), 'outbound')
    expect(found[0].policies[0].rules).toEqual([])
    expect(found[0].policies[0].egressRules.map(({ rule }) => rule.id)).toEqual([2, 3])
  })

  it('moves an egress rule among egress rules', () => {
    const document = doc(app())
    expect(moveRule(document, 'app', 3, 'up')).toBe(true)
    expect(document.policies[0].egress!.map(rule => rule.id)).toEqual([3, 2])
    expect(document.policies[0].ingress.map(rule => rule.id)).toEqual([1])
  })

  it('reviews egress rules and warns about an egress drop without rules', () => {
    const before = doc(app())
    const after = doc(app({ egress: [] }))
    const details = changeDetails(before, after)
    expect(details.policies[0].rules.map(change => [change.type, change.rule.id])).toEqual([
      ['removed', 2],
      ['removed', 3],
    ])
    expect(publishWarnings(details, { memberCount: () => 2 }).map(warning => warning.type)).toEqual([
      'egress-drop-without-rules',
    ])
  })

  it('rebases egress rules on their own', () => {
    const base = doc(app())
    const mine = doc(app({ egress: [...app().egress!, { id: 4, to: 'web', proto: 'tcp' }] }))
    const theirs = doc(app({ ingress: [...app().ingress, { id: 5, from: 'db', proto: 'tcp' }] }))
    const { document, conflicts } = mergeDocuments(base, mine, theirs)
    expect(conflicts).toEqual([])
    expect(document.policies[0].ingress.map(rule => rule.id)).toEqual([1, 5])
    expect(document.policies[0].egress!.map(rule => rule.id)).toEqual([2, 3, 4])
  })
})

describe('monitor mode with egress', () => {
  const entry = {
    src: '10.0.0.2',
    dst: '10.0.0.3',
    egress: true,
    vm: 'vm-app',
    vmName: 'app',
    proto: 'tcp',
    port: 6379,
    policy: 'app',
    tier: 'application',
    count: 3,
    first: '2026-10-24T10:00:00Z',
    last: '2026-10-24T10:00:00Z',
  }

  it('suggests an outbound rule to the destination, before the rule that would drop', () => {
    const groupOf = (address: string) => (address === '10.0.0.3' ? 'db' : address)
    expect(suggestRules([entry], app(), groupOf).map(s => [s.rule, s.before])).toEqual([
      [{ to: 'db', proto: 'tcp', ports: [6379] }, undefined],
    ])
    expect(suggestRules([{ ...entry, port: 25, rule: 3 }], app(), groupOf)[0].before).toBe(3)
  })

  it('covers a would-be drop with an outbound rule only', () => {
    const groupsOf = (address: string) => (address === '10.0.0.3' ? ['db'] : [])
    expect(coveredBy(app(), { ...entry, port: 5432 }, groupsOf)).toBe(true)
    expect(coveredBy(app(), entry, groupsOf)).toBe(false)
    // an ingress rule from db doesn't allow what app sends to db
    expect(coveredBy(app({ ingress: [{ id: 9, from: 'db', proto: 'tcp' }] }), entry, groupsOf)).toBe(false)
  })

  it('inserts an outbound rule among the outbound rules', () => {
    const policy = app()
    insertRule(policy, { id: 9, to: 'db', proto: 'tcp', ports: [6379] }, 3)
    expect(policy.egress!.map(rule => rule.id)).toEqual([2, 9, 3])
    expect(policy.ingress.map(rule => rule.id)).toEqual([1])
  })
})
