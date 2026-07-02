import { defineJobArg } from '@core/packages/job'
import type { TrafficRule } from '@vates/types'

export const xoTrafficRulesArg = defineJobArg({
  identify: (rule: TrafficRule) => rule.id,
  toArray: true,
})

export const newTrafficRulePayloadArg = defineJobArg({
  identify: false,
  toArray: false,
})
