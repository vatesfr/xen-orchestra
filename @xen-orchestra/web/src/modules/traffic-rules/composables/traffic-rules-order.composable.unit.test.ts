import { useTrafficRulesOrder } from '@/modules/traffic-rules/composables/traffic-rules-order.composable.ts'
import type { RankedTrafficRule } from '@/modules/traffic-rules/types.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { XoNetwork } from '@vates/types'

const NETWORK_ID = 'network-1' as XoNetwork['id']

function createRule(id: string, rank: number): RankedTrafficRule {
  return {
    id,
    allow: true,
    protocol: 'TCP',
    ipRange: '10.0.0.0/8',
    direction: 'to',
    priority: undefined,
    networkId: NETWORK_ID,
    type: 'network',
    sourceId: NETWORK_ID,
    rank,
  }
}

const RULE_A = createRule('rule-a', 1)
const RULE_B = createRule('rule-b', 2)
const RULE_C = createRule('rule-c', 3)

function mountTrafficRulesOrder(rules: RankedTrafficRule[] = [RULE_A, RULE_B, RULE_C]) {
  return mountComposable(() => useTrafficRulesOrder(() => rules)).wrapper.vm
}

function getOrderedIds(orderedRules: RankedTrafficRule[]) {
  return orderedRules.map(rule => rule.id)
}

beforeEach(() => {
  localStorage.clear()
})

describe('orderedRules', () => {
  it('starts in the order of the given rules', () => {
    const order = mountTrafficRulesOrder()

    expect(getOrderedIds(order.orderedRules)).toEqual(['rule-a', 'rule-b', 'rule-c'])
  })

  it('does not mutate the given rules', () => {
    const rules = [RULE_A, RULE_B, RULE_C]
    const order = mountTrafficRulesOrder(rules)

    order.moveRule(RULE_A, 1)

    expect(getOrderedIds(rules)).toEqual(['rule-a', 'rule-b', 'rule-c'])
  })
})

describe('moveRule', () => {
  it('moves a rule up', () => {
    const order = mountTrafficRulesOrder()

    order.moveRule(RULE_C, -1)

    expect(getOrderedIds(order.orderedRules)).toEqual(['rule-a', 'rule-c', 'rule-b'])
  })

  it('moves a rule down', () => {
    const order = mountTrafficRulesOrder()

    order.moveRule(RULE_A, 1)

    expect(getOrderedIds(order.orderedRules)).toEqual(['rule-b', 'rule-a', 'rule-c'])
  })

  it('does not move the first rule up', () => {
    const order = mountTrafficRulesOrder()

    order.moveRule(RULE_A, -1)

    expect(getOrderedIds(order.orderedRules)).toEqual(['rule-a', 'rule-b', 'rule-c'])
  })

  it('does not move the last rule down', () => {
    const order = mountTrafficRulesOrder()

    order.moveRule(RULE_C, 1)

    expect(getOrderedIds(order.orderedRules)).toEqual(['rule-a', 'rule-b', 'rule-c'])
  })

  it('ignores a rule that is not in the order', () => {
    const order = mountTrafficRulesOrder()

    order.moveRule(createRule('rule-d', 4), -1)

    expect(getOrderedIds(order.orderedRules)).toEqual(['rule-a', 'rule-b', 'rule-c'])
  })

  it('shows the page the moved rule lands on', () => {
    const order = mountTrafficRulesOrder()

    order.paginationBindings['onUpdate:showBy'](2)
    order.moveRule(RULE_B, 1)

    expect(getOrderedIds(order.paginatedRules)).toEqual(['rule-b'])
  })
})

describe('getNewRank', () => {
  it('is the position of the rule in the order', () => {
    const order = mountTrafficRulesOrder()

    order.moveRule(RULE_C, -1)

    expect(order.getNewRank(RULE_A)).toBe(1)
    expect(order.getNewRank(RULE_C)).toBe(2)
    expect(order.getNewRank(RULE_B)).toBe(3)
  })
})

describe('isFirstRule and isLastRule', () => {
  it('follow the moves', () => {
    const order = mountTrafficRulesOrder()

    order.moveRule(RULE_A, 1)

    expect(order.isFirstRule(RULE_B)).toBe(true)
    expect(order.isFirstRule(RULE_A)).toBe(false)
    expect(order.isLastRule(RULE_C)).toBe(true)
    expect(order.isLastRule(RULE_A)).toBe(false)
  })
})
