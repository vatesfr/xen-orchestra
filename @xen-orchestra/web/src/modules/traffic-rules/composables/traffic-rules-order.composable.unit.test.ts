import { useTrafficRulesOrder } from '@/modules/traffic-rules/composables/traffic-rules-order.composable.ts'
import type { RankedTrafficRule } from '@/modules/traffic-rules/types.ts'
import { createTrafficRule, getTrafficRuleIds } from '@/test/create-traffic-rule.ts'
import { mountComposable } from '@/test/mount-composable.ts'

function createRule(id: string, rank: number): RankedTrafficRule {
  return { ...createTrafficRule({ id, priority: undefined }), rank }
}

const RULE_A = createRule('rule-a', 1)
const RULE_B = createRule('rule-b', 2)
const RULE_C = createRule('rule-c', 3)

function mountTrafficRulesOrder(rules: RankedTrafficRule[] = [RULE_A, RULE_B, RULE_C]) {
  return mountComposable(() => useTrafficRulesOrder(() => rules)).wrapper.vm
}

beforeEach(() => {
  localStorage.clear()
})

describe('orderedRules', () => {
  it('starts in the order of the given rules', () => {
    const order = mountTrafficRulesOrder()

    expect(getTrafficRuleIds(order.orderedRules)).toEqual(['rule-a', 'rule-b', 'rule-c'])
  })

  it('does not mutate the given rules', () => {
    const rules = [RULE_A, RULE_B, RULE_C]
    const order = mountTrafficRulesOrder(rules)

    order.moveRule(RULE_A, 1)

    expect(getTrafficRuleIds(rules)).toEqual(['rule-a', 'rule-b', 'rule-c'])
  })
})

describe('moveRule', () => {
  it.each([
    { name: 'moves a rule up', rule: RULE_C, offset: -1, expected: ['rule-a', 'rule-c', 'rule-b'] },
    { name: 'moves a rule down', rule: RULE_A, offset: 1, expected: ['rule-b', 'rule-a', 'rule-c'] },
    { name: 'does not move the first rule up', rule: RULE_A, offset: -1, expected: ['rule-a', 'rule-b', 'rule-c'] },
    { name: 'does not move the last rule down', rule: RULE_C, offset: 1, expected: ['rule-a', 'rule-b', 'rule-c'] },
    {
      name: 'ignores a rule that is not in the order',
      rule: createRule('rule-d', 4),
      offset: -1,
      expected: ['rule-a', 'rule-b', 'rule-c'],
    },
  ] as const)('$name', ({ rule, offset, expected }) => {
    const order = mountTrafficRulesOrder()

    order.moveRule(rule, offset)

    expect(getTrafficRuleIds(order.orderedRules)).toEqual(expected)
  })

  it('shows the page the moved rule lands on', () => {
    const order = mountTrafficRulesOrder()

    order.paginationBindings['onUpdate:showBy'](2)
    order.moveRule(RULE_B, 1)

    expect(getTrafficRuleIds(order.paginatedRules)).toEqual(['rule-b'])
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
