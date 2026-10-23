import type { TrafficRule } from '@vates/types'

export type EnrichedTrafficRule = TrafficRule & {
  networkLabel: string
  priority: number
  directionA: string
  directionB: string
  directionLabel: string
  objectLabel: string
}
