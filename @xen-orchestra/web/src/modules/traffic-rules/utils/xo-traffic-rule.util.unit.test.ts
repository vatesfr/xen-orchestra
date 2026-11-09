import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import {
  getNetworkRules,
  getOrdinalSuffix,
  getTrafficRulePriority,
  getTrafficRuleProtocolLabel,
  rankTrafficRules,
} from '@/modules/traffic-rules/utils/xo-traffic-rule.util.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { createTrafficRule } from '@/test/create-traffic-rule.ts'

const EN_SUFFIXES = 'one:st, two:nd, few:rd, other:th'
const FR_SUFFIXES = 'one:re, other:e'

describe('getTrafficRulePriority', () => {
  it('returns the priority of the rule', () => {
    expect(getTrafficRulePriority(createTrafficRule({ priority: 65000 }))).toBe(65000)
  })

  it('keeps a priority of 0', () => {
    expect(getTrafficRulePriority(createTrafficRule({ priority: 0 }))).toBe(0)
  })

  it('defaults to the OpenFlow priority when the rule has none', () => {
    expect(getTrafficRulePriority(createTrafficRule({ priority: undefined }))).toBe(32768)
  })
})

describe('getTrafficRuleProtocolLabel', () => {
  it('returns the protocol alone when the rule has no port', () => {
    expect(getTrafficRuleProtocolLabel(createTrafficRule({ protocol: 'ICMP', port: undefined }))).toBe('ICMP')
  })

  it('appends the port to the protocol', () => {
    expect(getTrafficRuleProtocolLabel(createTrafficRule({ protocol: 'TCP', port: '443' }))).toBe('TCP:443')
  })
})

describe('getNetworkRules', () => {
  const networkA = 'network-a' as FrontXoNetwork['id']
  const networkB = 'network-b' as FrontXoNetwork['id']

  const ruleA1 = createTrafficRule({ id: 'a1', networkId: networkA })
  const ruleB1 = createTrafficRule({ id: 'b1', networkId: networkB })
  const ruleA2 = createTrafficRule({ id: 'a2', networkId: networkA })

  it('keeps only the rules of the given network, in their order', () => {
    expect(getNetworkRules([ruleA1, ruleB1, ruleA2], networkA)).toEqual([ruleA1, ruleA2])
  })

  it('returns an empty list when the network has no rule', () => {
    expect(getNetworkRules([ruleA1, ruleA2], networkB)).toEqual([])
  })
})

describe('rankTrafficRules', () => {
  const lanNetwork = 'network-1' as FrontXoNetwork['id']
  const dmzNetwork = 'network-2' as FrontXoNetwork['id']
  const otherLanNetwork = 'network-3' as FrontXoNetwork['id']

  const networkLabels = new Map<FrontXoNetwork['id'], string>([
    [lanNetwork, 'LAN'],
    [dmzNetwork, 'DMZ'],
    [otherLanNetwork, 'LAN'],
  ])

  const getNetworkLabel = (networkId: FrontXoNetwork['id']) => networkLabels.get(networkId) ?? ''

  it('sorts by descending priority within a network', () => {
    const low = createTrafficRule({ id: 'low', priority: 100 })
    const high = createTrafficRule({ id: 'high', priority: 200 })

    expect(rankTrafficRules([low, high], getNetworkLabel).map(rule => rule.id)).toEqual(['high', 'low'])
  })

  it('places rules without priority at the default priority', () => {
    const above = createTrafficRule({ id: 'above', priority: 40000 })
    const none = createTrafficRule({ id: 'none', priority: undefined })
    const below = createTrafficRule({ id: 'below', priority: 100 })

    expect(rankTrafficRules([below, none, above], getNetworkLabel).map(rule => rule.id)).toEqual([
      'above',
      'none',
      'below',
    ])
  })

  it('keeps input order for rules with equal priority', () => {
    const networkRule = createTrafficRule({ id: 'network' })
    const vifRuleA = createTrafficRule({ id: 'vif-a', type: 'VIF', sourceId: 'vif-a' as FrontXoVif['id'] })
    const vifRuleB = createTrafficRule({ id: 'vif-b', type: 'VIF', sourceId: 'vif-b' as FrontXoVif['id'] })

    expect(rankTrafficRules([networkRule, vifRuleA, vifRuleB], getNetworkLabel).map(rule => rule.id)).toEqual([
      'network',
      'vif-a',
      'vif-b',
    ])
  })

  it('gives distinct ranks to rules with equal priority', () => {
    const rules = [createTrafficRule({ id: 'a' }), createTrafficRule({ id: 'b' })]

    expect(rankTrafficRules(rules, getNetworkLabel).map(rule => rule.rank)).toEqual([1, 2])
  })

  it('groups rules by network label and restarts ranks per network', () => {
    const lan = createTrafficRule({ id: 'lan', networkId: lanNetwork })
    const dmz = createTrafficRule({ id: 'dmz', networkId: dmzNetwork })

    expect(rankTrafficRules([lan, dmz], getNetworkLabel).map(rule => ({ id: rule.id, rank: rule.rank }))).toEqual([
      { id: 'dmz', rank: 1 },
      { id: 'lan', rank: 1 },
    ])
  })

  it('does not interleave two networks with the same label', () => {
    const rules = [
      createTrafficRule({ id: 'n1-low', networkId: lanNetwork, priority: 100 }),
      createTrafficRule({ id: 'n3-high', networkId: otherLanNetwork, priority: 300 }),
      createTrafficRule({ id: 'n1-high', networkId: lanNetwork, priority: 200 }),
    ]

    expect(rankTrafficRules(rules, getNetworkLabel).map(rule => rule.id)).toEqual(['n1-high', 'n1-low', 'n3-high'])
  })

  it('does not mutate the input array', () => {
    const rules = [createTrafficRule({ id: 'low', priority: 100 }), createTrafficRule({ id: 'high', priority: 200 })]

    rankTrafficRules(rules, getNetworkLabel)

    expect(rules.map(rule => rule.id)).toEqual(['low', 'high'])
  })
})

describe('getOrdinalSuffix', () => {
  it.each([
    [1, 'st'],
    [2, 'nd'],
    [3, 'rd'],
    [4, 'th'],
    [11, 'th'],
    [12, 'th'],
    [13, 'th'],
    [21, 'st'],
    [22, 'nd'],
    [23, 'rd'],
    [101, 'st'],
  ])('returns the English suffix of %i', (position, suffix) => {
    expect(getOrdinalSuffix(EN_SUFFIXES, 'en', position)).toBe(suffix)
  })

  it.each([
    [1, 're'],
    [2, 'e'],
    [21, 'e'],
  ])('returns the French suffix of %i', (position, suffix) => {
    expect(getOrdinalSuffix(FR_SUFFIXES, 'fr', position)).toBe(suffix)
  })

  it('ignores the spaces around the entries', () => {
    expect(getOrdinalSuffix('  one:st ,other:th  ', 'en', 1)).toBe('st')
  })

  it('returns undefined when the message has no suffix for the plural category', () => {
    expect(getOrdinalSuffix('other:th', 'en', 1)).toBeUndefined()
  })
})
