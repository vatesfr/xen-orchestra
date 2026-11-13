import type { TrafficRule } from '@vates/types'

export type RankedTrafficRule = TrafficRule & {
  rank: number
}

export type EnrichedTrafficRule = RankedTrafficRule & {
  networkLabel: string
  networkRuleCount: number
  directionA: string
  directionB: string
  directionLabel: string
  objectLabel: string
}
