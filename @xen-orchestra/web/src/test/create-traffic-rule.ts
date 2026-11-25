import type { TrafficRule, XoNetwork } from '@vates/types'

/**
 * Builds a fully-populated network `TrafficRule` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createTrafficRule(overrides: Partial<TrafficRule> = {}): TrafficRule {
  return {
    id: 'network:network-1:0',
    type: 'network',
    sourceId: 'network-1' as XoNetwork['id'],
    networkId: 'network-1' as XoNetwork['id'],
    allow: true,
    protocol: 'TCP',
    ipRange: '192.168.1.0/24',
    direction: 'from/to',
    ...overrides,
  } as TrafficRule
}

// The ids of the rules, in their order
export function getTrafficRuleIds(rules: Pick<TrafficRule, 'id'>[]) {
  return rules.map(rule => rule.id)
}
