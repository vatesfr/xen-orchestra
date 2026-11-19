import { defineJobArg } from '@core/packages/job'
import type { TrafficRule } from '@vates/types'

export const orderedTrafficRulesArg = defineJobArg<TrafficRule[]>({
  identify: false,
  toArray: false,
})
