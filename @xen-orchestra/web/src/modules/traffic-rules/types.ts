import type { TrafficRule } from '@vates/types'

export type EnrichedTrafficRule = TrafficRule & {
  order: number
  directionA: string
  directionB: string
  directionLabel: string
  objectLabel: string
}
