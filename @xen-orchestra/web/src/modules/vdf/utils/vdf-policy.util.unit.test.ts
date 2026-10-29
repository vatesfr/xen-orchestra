import type { VdfDocument } from '@/modules/vdf/types.ts'
import {
  diffDocuments,
  effectiveTiers,
  filterRuleBase,
  formatPorts,
  isVmInGroup,
  movePolicy,
  moveRule,
  nextRuleId,
  parsePorts,
  policiesByTier,
  reservedTierPolicies,
  ruleBase,
  tierDefault,
  tierValue,
  toTierRef,
  vmGroupNames,
} from '@/modules/vdf/utils/vdf-policy.util.ts'
import { describe, expect, it } from 'vitest'

const document: VdfDocument = {
  groups: {
    admins: { ips: ['192.168.1.30'] },
    web: { tags: ['vdf:role=web'] },
    app: { tags: ['vdf:role=app'] },
    prod: { tags: ['vdf:role=app', 'vdf:env=prod'] },
  },
  policies: [
    { name: 'app', appliedTo: 'app', default: 'pass', ingress: [{ id: 1, from: 'web', proto: 'tcp', ports: [8080] }] },
    {
      name: 'baseline',
      tier: 'baseline',
      appliedTo: 'app',
      default: 'drop',
      ingress: [{ id: 2, from: 'admins', proto: 'tcp', ports: [22] }],
    },
    {
      name: 'incident',
      tier: 'emergency',
      appliedTo: 'prod',
      default: 'pass',
      ingress: [{ id: 3, action: 'drop', from: 'web', proto: 'tcp', ports: [9999] }],
    },
  ],
}

describe('tiers', () => {
  it('reads names and numbers, application when omitted', () => {
    expect(tierValue(undefined)).toBe(100)
    expect(tierValue('emergency')).toBe(0)
    expect(tierValue(42)).toBe(42)
  })

  it('writes application as no tier, so the document stays readable by older agents', () => {
    expect(toTierRef(100)).toBeUndefined()
    expect(toTierRef(110)).toBe('baseline')
    expect(toTierRef(42)).toBe(42)
  })

  it('orders tiers by value, policies by document order within a tier', () => {
    expect(policiesByTier(document).map(tier => [tier.value, tier.policies.map(({ policy }) => policy.name)])).toEqual([
      [0, ['incident']],
      [100, ['app']],
      [110, ['baseline']],
    ])
  })

  it("lists the pool's own policies in the tiers kept for global policies (vdf#21)", () => {
    const withGlobal: VdfDocument = {
      ...document,
      policies: [
        { name: 'global:soc', tier: 'emergency', appliedTo: 'app', default: 'pass', ingress: [] },
        { name: 'early', tier: 10, appliedTo: 'app', default: 'pass', ingress: [] },
        { name: 'net', tier: 'networkops', appliedTo: 'app', default: 'pass', ingress: [] },
        ...document.policies,
      ],
    }

    expect(reservedTierPolicies(withGlobal)).toEqual(['early', 'incident'])
  })

  it('combines the defaults of a tier: drop, else allow, else pass', () => {
    const policy = (action: 'allow' | 'drop' | 'pass') => ({
      name: action,
      appliedTo: 'app',
      default: action,
      ingress: [],
    })

    expect(tierDefault([policy('pass'), policy('allow'), policy('drop')])).toBe('drop')
    expect(tierDefault([policy('pass'), policy('allow')])).toBe('allow')
    expect(tierDefault([policy('pass')])).toBe('pass')
  })
})

describe('effectiveTiers', () => {
  it('lists only the policies applying to a VM carrying all their group tags', () => {
    expect(effectiveTiers(['vdf:role=app'], document).map(tier => tier.policies.map(policy => policy.name))).toEqual([
      ['app'],
      ['baseline'],
    ])
    expect(effectiveTiers(['vdf:role=app', 'vdf:env=prod'], document).map(tier => tier.value)).toEqual([0, 100, 110])
    expect(effectiveTiers(['vdf:role=web'], document)).toEqual([])
  })
})

// vdf#98: a group on networks alone, by its VMs' interfaces
describe('groups on networks alone', () => {
  const cust = { networks: ['vdf:net=customer'] }
  const doc: VdfDocument = {
    version: 7,
    groups: { cust, web: { tags: ['vdf:role=web'] } },
    policies: [{ name: 'customer', appliedTo: 'cust', default: 'drop', mode: 'monitor', ingress: [] }],
  }

  it('selects a VM by an interface on its networks, whatever its tags', () => {
    expect(isVmInGroup([], cust, [['vdf:net=customer'], ['vdf:net=backend']])).toBe(true)
    expect(isVmInGroup(['vdf:role=web'], cust, [['vdf:net=backend']])).toBe(false)
    // its interfaces unknown: none
    expect(isVmInGroup([], cust)).toBe(false)
    // vdf:unprotected on the network wins
    expect(isVmInGroup([], cust, [['vdf:net=customer', 'vdf:unprotected']])).toBe(false)
    expect(vmGroupNames(['vdf:role=web'], doc, [['vdf:net=customer']])).toEqual(['cust', 'web'])
  })

  it('applies its policy to such a VM', () => {
    expect(effectiveTiers([], doc, [['vdf:net=customer']]).flatMap(tier => tier.policies.map(p => p.name))).toEqual([
      'customer',
    ])
    expect(effectiveTiers([], doc, [['vdf:net=backend']])).toEqual([])
  })
})

describe('rules', () => {
  it('gives a new rule an id above every existing one', () => {
    expect(nextRuleId(document)).toBe(4)
    expect(nextRuleId({ groups: {}, policies: [] })).toBe(1)
  })

  it("doesn't reuse the id of a rule deleted in the draft", () => {
    const draft = structuredClone(document)

    draft.policies[2].ingress = []

    expect(nextRuleId(draft)).toBe(3)
    expect(nextRuleId(draft, document)).toBe(4)
  })

  it('parses port lists, refuses what agents would reject', () => {
    expect(parsePorts('80, 443 443')).toEqual([80, 443])
    expect(parsePorts('')).toEqual([])
    expect(parsePorts('0')).toBeUndefined()
    expect(parsePorts('http')).toBeUndefined()
  })

  it('parses port ranges as "low-high" strings (vdf#54)', () => {
    expect(parsePorts('22, 8000-8099')).toEqual([22, '8000-8099'])
    expect(parsePorts('8000 - 8099 443')).toEqual(['8000-8099', 443])
    expect(parsePorts('25-25')).toEqual([25])
    expect(parsePorts('8099-8000')).toBeUndefined()
    expect(parsePorts('1-65536')).toBeUndefined()
    expect(parsePorts('0-10')).toBeUndefined()
    expect(parsePorts('8000-')).toBeUndefined()
    expect(parsePorts('1-2-3')).toBeUndefined()
    expect(formatPorts([22, '8000-8099'])).toBe('22, 8000-8099')
  })
})

describe('diffDocuments', () => {
  it('reports nothing for the same document', () => {
    expect(diffDocuments(document, structuredClone(document))).toEqual([])
  })

  it('reports groups, policies and rules added, modified, removed and moved', () => {
    const draft = structuredClone(document)

    draft.groups.admins.ips = ['192.168.1.30', '192.168.1.46']
    draft.policies[0].ingress.push({ id: 4, from: 'admins', proto: 'tcp', ports: [22] })
    draft.policies[1].default = 'pass'
    draft.policies = [draft.policies[1], draft.policies[0]]

    expect(diffDocuments(document, draft)).toEqual([
      { kind: 'group', type: 'modified', label: 'admins' },
      { kind: 'policy', type: 'modified', label: 'baseline' },
      { kind: 'rule', type: 'added', label: '4', context: 'app' },
      { kind: 'policy', type: 'removed', label: 'incident' },
      { kind: 'policy', type: 'moved', label: '' },
    ])
  })
})

describe('ruleBase', () => {
  const names = (tiers: ReturnType<typeof ruleBase>) =>
    tiers.map(tier => [tier.value, tier.policies.map(({ policy, state }) => `${policy.name}:${state ?? ''}`)])

  it('lists every named tier, in order, with its default', () => {
    const tiers = ruleBase(document, document)

    expect(tiers.map(tier => tier.value)).toEqual([0, 25, 50, 75, 100, 110])
    expect(tiers.find(tier => tier.value === 110)?.default).toBe('drop')
    expect(tiers.find(tier => tier.value === 25)?.policies).toEqual([])
  })

  it('marks what the draft adds, changes and removes, removed ones where they were', () => {
    const draft = structuredClone(document)

    draft.policies[0].ingress.unshift({ id: 4, from: 'admins', proto: 'tcp', ports: [22] })
    draft.policies[1].default = 'pass'
    draft.policies.splice(2, 1)
    draft.policies.push({ name: 'web', appliedTo: 'web', default: 'drop', ingress: [] })

    const tiers = ruleBase(draft, document)

    expect(names(tiers).filter(([, policies]) => (policies as string[]).length > 0)).toEqual([
      [0, ['incident:removed']],
      [100, ['app:', 'web:new']],
      [110, ['baseline:modified']],
    ])
    expect(tiers[4].policies[0].rules.map(({ rule, state }) => [rule.id, state])).toEqual([
      [4, 'new'],
      [1, undefined],
    ])
    // the rules of a removed policy go with it, they aren't marked one by one
    expect(tiers[0].policies[0].rules.map(({ state }) => state)).toEqual([undefined])
  })

  it('shows a rule deleted in the draft right after its published predecessor', () => {
    const published = structuredClone(document)
    const draft = structuredClone(document)

    published.policies[0].ingress = [
      { id: 1, from: 'web', proto: 'tcp', ports: [8080] },
      { id: 5, from: 'admins', proto: 'tcp', ports: [22] },
      { id: 6, from: 'admins', proto: 'tcp', ports: [80] },
    ]
    draft.policies[0].ingress = [published.policies[0].ingress[0], published.policies[0].ingress[2]]

    const [first, removed, last] = ruleBase(draft, published)[4].policies[0].rules

    expect([first.rule.id, removed.rule.id, last.rule.id]).toEqual([1, 5, 6])
    expect(removed.state).toBe('removed')
    expect([first.isFirst, last.isLast, removed.isFirst]).toEqual([true, true, false])
  })

  it('keeps locked policies out of the moves', () => {
    const draft = structuredClone(document)

    draft.policies.push({ name: 'global:ssh', appliedTo: 'app', default: 'pass', ingress: [] })

    const [locked, app] = ruleBase(draft, draft, name => name.startsWith('global:'))[4].policies.sort(
      (entryA, entryB) => Number(entryB.locked) - Number(entryA.locked)
    )

    expect([locked.locked, locked.isFirst, app.isFirst, app.isLast]).toEqual([true, false, true, true])
  })
})

describe('filterRuleBase', () => {
  const tiers = ruleBase(document, document)
  const found = (query: string) =>
    filterRuleBase(tiers, query).flatMap(tier =>
      tier.policies.map(({ policy, rules }) => `${policy.name}:${rules.map(({ rule }) => rule.id).join(',')}`)
    )

  it('finds policies by name or group, with all their rules', () => {
    expect(found('baseline')).toEqual(['baseline:2'])
    expect(found('prod')).toEqual(['incident:3'])
  })

  it('finds rules by source, port or id, and drops empty tiers', () => {
    expect(found('web')).toEqual(['incident:3', 'app:1'])
    expect(found('22')).toEqual(['baseline:2'])
    expect(found('#1')).toEqual(['app:1'])
    expect(found('prod 9999')).toEqual(['incident:3'])
    expect(found('app 9999')).toEqual([])
    expect(filterRuleBase(tiers, 'nothing')).toEqual([])
    expect(filterRuleBase(tiers, '  ')).toBe(tiers)
  })
})

describe('moves', () => {
  const draft = (): VdfDocument => ({
    groups: {},
    policies: ['a', 'b', 'c'].map(name => ({ name, appliedTo: 'app', default: 'drop', ingress: [] })),
  })

  it('moves a policy within its tier, to an end or one step', () => {
    const moved = draft()

    moved.policies.splice(1, 0, { name: 'early', tier: 'emergency', appliedTo: 'app', default: 'pass', ingress: [] })

    expect(movePolicy(moved, 'c', 'top')).toBe(true)
    expect(moved.policies.map(({ name }) => name)).toEqual(['c', 'early', 'a', 'b'])
    expect(movePolicy(moved, 'c', 'up')).toBe(false)
    expect(movePolicy(moved, 'a', 'bottom')).toBe(true)
    expect(moved.policies.map(({ name }) => name)).toEqual(['c', 'early', 'b', 'a'])
  })

  it("doesn't move a policy past a locked one", () => {
    const moved = draft()

    moved.policies.unshift({ name: 'global:ssh', appliedTo: 'app', default: 'pass', ingress: [] })

    expect(movePolicy(moved, 'b', 'top', name => name.startsWith('global:'))).toBe(true)
    expect(moved.policies.map(({ name }) => name)).toEqual(['global:ssh', 'b', 'a', 'c'])
    expect(movePolicy(moved, 'global:ssh', 'bottom', name => name.startsWith('global:'))).toBe(false)
  })

  it('moves a rule within its policy', () => {
    const moved = structuredClone(document)

    moved.policies[0].ingress.push({ id: 7, from: 'any', proto: 'icmp' }, { id: 8, from: 'any', proto: 'udp' })

    expect(moveRule(moved, 'app', 8, 'top')).toBe(true)
    expect(moved.policies[0].ingress.map(({ id }) => id)).toEqual([8, 1, 7])
    expect(moveRule(moved, 'app', 7, 'down')).toBe(false)
  })
})
