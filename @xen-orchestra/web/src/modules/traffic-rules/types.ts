import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'

export const SDN_CONTROLLER_OF_RULES_KEY = 'xo:sdn-controller:of-rules'
export const TRAFFIC_RULE_PROTOCOLS = ['ARP', 'ICMP', 'IP', 'TCP', 'UDP'] as const

export type TrafficRuleDirection = 'from' | 'to' | 'from/to'

export type TrafficRuleProtocol = (typeof TRAFFIC_RULE_PROTOCOLS)[number]

export type TrafficRuleTargetType = 'network' | 'VIF'

export type RawTrafficRule = {
  allow: boolean
  protocol: string
  ipRange: string
  direction: string
  port?: string
}

type BaseTrafficRule = RawTrafficRule & {
  id: string
  networkId: FrontXoNetwork['id']
}

export type TrafficRule =
  | (BaseTrafficRule & { type: 'VIF'; sourceId: FrontXoVif['id'] })
  | (BaseTrafficRule & { type: 'network'; sourceId: FrontXoNetwork['id'] })

export type EnrichedTrafficRule = TrafficRule & {
  order: number
  directionA: string
  directionB: string
  objectLabel: string
}
