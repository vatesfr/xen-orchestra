import type { VdfDocument } from '@/modules/vdf/types.ts'
import {
  diffDocuments,
  effectiveTiers,
  nextRuleId,
  parsePorts,
  policiesByTier,
  tierDefault,
  tierValue,
  toTierRef,
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

describe('rules', () => {
  it('gives a new rule an id above every existing one', () => {
    expect(nextRuleId(document)).toBe(4)
    expect(nextRuleId({ groups: {}, policies: [] })).toBe(1)
  })

  it('parses port lists, refuses what agents would reject', () => {
    expect(parsePorts('80, 443 443')).toEqual([80, 443])
    expect(parsePorts('')).toEqual([])
    expect(parsePorts('0')).toBeUndefined()
    expect(parsePorts('http')).toBeUndefined()
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
