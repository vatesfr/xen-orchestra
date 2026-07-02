import type { NewTrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import { defineJobArg } from '@core/packages/job'
import type { TrafficRule } from '@vates/types'

export const xoTrafficRulesArg = defineJobArg({
  identify: (rule: TrafficRule) => rule.id,
  toArray: true,
})

export const newTrafficRulePayloadArg = defineJobArg<NewTrafficRulePayload>({
  identify: false,
  toArray: false,
})
