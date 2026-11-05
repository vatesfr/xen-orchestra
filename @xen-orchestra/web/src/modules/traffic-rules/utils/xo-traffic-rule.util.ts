import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { SDN_CONTROLLER_OF_METHOD_KEY, type TrafficRule, type XoNetwork } from '@vates/types'

// OpenFlow default, applied to rules stored without a priority
const DEFAULT_TRAFFIC_RULE_PRIORITY = 32768

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

export function getNetworkRules<TRule extends TrafficRule>(rules: TRule[], networkId: XoNetwork['id']): TRule[] {
  return rules.filter(rule => rule.networkId === networkId)
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
