import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { RankedTrafficRule } from '@/modules/traffic-rules/types.ts'
import { SDN_CONTROLLER_OF_METHOD_KEY, type TrafficRule } from '@vates/types'

// OpenFlow default, applied to rules stored without a priority
const DEFAULT_TRAFFIC_RULE_PRIORITY = 32768

const MIN_TRAFFIC_RULE_PRIORITY = 0

const MAX_TRAFFIC_RULE_PRIORITY = 65535

type TrafficRulePriorityUpdate = {
  rule: TrafficRule
  priority: number
}

export function isNetworkRuleSupported(pool: FrontXoPool | undefined): boolean {
  const ofMethod = pool?.otherConfig[SDN_CONTROLLER_OF_METHOD_KEY]

  return ofMethod === 'xapi-plugin'
}

export function getTrafficRulePriority(rule: TrafficRule): number {
  if (rule.priority === undefined) {
    return DEFAULT_TRAFFIC_RULE_PRIORITY
  }

  return rule.priority
}

export function getTrafficRuleProtocolLabel(rule: TrafficRule): string {
  if (rule.port === undefined) {
    return rule.protocol
  }

  return `${rule.protocol}:${rule.port}`
}

export function getNetworkRules<TRule extends TrafficRule>(rules: TRule[], networkId: FrontXoNetwork['id']): TRule[] {
  return rules.filter(rule => rule.networkId === networkId)
}

export function rankTrafficRules(
  rules: TrafficRule[],
  getNetworkLabel: (networkId: FrontXoNetwork['id']) => string
): RankedTrafficRule[] {
  const sortedRules = [...rules].sort((ruleA, ruleB) => {
    const networkComparison = getNetworkLabel(ruleA.networkId).localeCompare(getNetworkLabel(ruleB.networkId))

    if (networkComparison !== 0) {
      return networkComparison
    }

    if (ruleA.networkId !== ruleB.networkId) {
      return ruleA.networkId.localeCompare(ruleB.networkId)
    }

    return getTrafficRulePriority(ruleB) - getTrafficRulePriority(ruleA)
  })

  const lastRankByNetworkId = new Map<FrontXoNetwork['id'], number>()

  return sortedRules.map(rule => {
    const lastRank = lastRankByNetworkId.get(rule.networkId)

    let rank = 1

    if (lastRank !== undefined) {
      rank = lastRank + 1
    }

    lastRankByNetworkId.set(rule.networkId, rank)

    return { ...rule, rank }
  })
}

function getKeptRuleIndexes(orderedRules: TrafficRule[]): number[] {
  const chainLengths: number[] = []
  const chainPreviousIndexes: (number | undefined)[] = []
  let longestChainEndIndex: number | undefined

  orderedRules.forEach((rule, index) => {
    chainLengths[index] = 0
    chainPreviousIndexes[index] = undefined

    if (rule.priority === undefined) {
      return
    }

    chainLengths[index] = 1

    for (let previousIndex = 0; previousIndex < index; previousIndex++) {
      const previousRule = orderedRules[previousIndex]

      if (
        previousRule.priority !== undefined &&
        previousRule.priority > rule.priority &&
        chainLengths[previousIndex] + 1 > chainLengths[index]
      ) {
        chainLengths[index] = chainLengths[previousIndex] + 1
        chainPreviousIndexes[index] = previousIndex
      }
    }

    if (longestChainEndIndex === undefined || chainLengths[index] > chainLengths[longestChainEndIndex]) {
      longestChainEndIndex = index
    }
  })

  const keptIndexes: number[] = []
  let index = longestChainEndIndex

  while (index !== undefined) {
    keptIndexes.unshift(index)
    index = chainPreviousIndexes[index]
  }

  return keptIndexes
}

// The other rules get a priority between those of their kept neighbours, spread out to leave room for later moves.
// No new priority is one a rule of the network already has, so the updates never conflict with the other rules.
function getPriorityUpdatesBetweenKeptRules(
  orderedRules: TrafficRule[],
  keptIndexes: number[],
  takenPriorities: Set<number | undefined>
): TrafficRulePriorityUpdate[] | undefined {
  const boundIndexes = [-1, ...keptIndexes, orderedRules.length]
  const updates: TrafficRulePriorityUpdate[] = []

  for (let intervalIndex = 0; intervalIndex < boundIndexes.length - 1; intervalIndex++) {
    const upperIndex = boundIndexes[intervalIndex]
    const lowerIndex = boundIndexes[intervalIndex + 1]
    const movedRules = orderedRules.slice(upperIndex + 1, lowerIndex)

    if (movedRules.length === 0) {
      continue
    }

    let upperPriority = MAX_TRAFFIC_RULE_PRIORITY + 1

    if (upperIndex !== -1) {
      upperPriority = getTrafficRulePriority(orderedRules[upperIndex])
    }

    let lowerPriority = MIN_TRAFFIC_RULE_PRIORITY - 1

    if (lowerIndex !== orderedRules.length) {
      lowerPriority = getTrafficRulePriority(orderedRules[lowerIndex])
    }

    const freePriorities: number[] = []

    for (let priority = upperPriority - 1; priority > lowerPriority; priority--) {
      if (!takenPriorities.has(priority)) {
        freePriorities.push(priority)
      }
    }

    if (freePriorities.length <= movedRules.length) {
      return undefined
    }

    const step = freePriorities.length / (movedRules.length + 1)

    movedRules.forEach((rule, index) => {
      updates.push({ rule, priority: freePriorities[Math.floor((index + 1) * step)] })
    })
  }

  return updates
}

export function getTrafficRulePriorityUpdates(
  orderedRules: TrafficRule[],
  networkRules: TrafficRule[]
): TrafficRulePriorityUpdate[] | undefined {
  const takenPriorities = new Set(networkRules.map(rule => rule.priority))

  const updates = getPriorityUpdatesBetweenKeptRules(orderedRules, getKeptRuleIndexes(orderedRules), takenPriorities)

  if (updates !== undefined) {
    return updates
  }

  return getPriorityUpdatesBetweenKeptRules(orderedRules, [], takenPriorities)
}

export function getOrdinalSuffix(suffixesMessage: string, locale: string, position: number): string | undefined {
  const suffixes = new Map<string, string>()

  for (const entry of suffixesMessage.split(',')) {
    const [category, suffix] = entry.trim().split(':')
    suffixes.set(category, suffix)
  }

  const category = new Intl.PluralRules(locale, { type: 'ordinal' }).select(position)

  return suffixes.get(category)
}
