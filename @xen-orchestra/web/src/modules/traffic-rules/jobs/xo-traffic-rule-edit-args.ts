import type { UpdateTrafficRulePayload } from '@/modules/traffic-rules/jobs/xo-traffic-rule-update.job.ts'
import { defineJobArg } from '@core/packages/job'

export const payloadsArg = defineJobArg<UpdateTrafficRulePayload>({
  identify: payload => payload.oldRule.id,
  toArray: true,
})
