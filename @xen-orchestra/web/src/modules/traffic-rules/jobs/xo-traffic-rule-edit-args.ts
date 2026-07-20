import type { NewTrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import { defineJobArg } from '@core/packages/job'

export const newTrafficRulePayloadArg = defineJobArg<NewTrafficRulePayload>({
  identify: false,
  toArray: false,
})
