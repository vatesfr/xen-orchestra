import type { TrafficRule } from '@vates/types'
import type { RouteLocationAsRelative } from 'vue-router'

export type RankedTrafficRule = TrafficRule & {
  rank: number
}

export type EnrichedTrafficRule = RankedTrafficRule & {
  networkLabel: string
  networkTo: RouteLocationAsRelative | undefined
  networkRuleCount: number
  directionA: string
  directionB: string
  directionLabel: string
  objectLabel: string
}
